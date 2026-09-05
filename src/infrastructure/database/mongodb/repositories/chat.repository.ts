import { injectable } from "inversify";
import { type QueryFilter, Types } from "mongoose";
import type { Chat } from "../../../../domain/entities/chat.entity";
import type {
	ChatUserSummary,
	IChatRepository,
} from "../../../../domain/repositories/chat.repository.interface";
import { ChatMapper } from "../mappers/chat.mapper";
import { type ChatDocument, ChatModel } from "../models/chat.model";
import { AbstractMongoRepository } from "./abstract.repository";

type PopulatedUser = {
	_id?: { toString?: () => string };
	name?: string;
	profilePictureId?: string | null;
	role?: "USER" | "MENTOR" | "ADMIN" | "SUPER_ADMIN";
	toString?: () => string;
};

type PopulatedChatDocument = Omit<
	ChatDocument,
	"user1Id" | "user2Id" | "lastMessageId"
> & {
	user1Id: PopulatedUser | ChatDocument["user1Id"];
	user2Id: PopulatedUser | ChatDocument["user2Id"];
	lastMessageId?: {
		_id?: { toString?: () => string };
		senderId?: { toString?: () => string };
		messageType?: "TEXT" | "IMAGE" | "FILE";
		content?: string | null;
		mediaId?: { toString?: () => string } | string | null;
		createdAt?: Date;
	};
};

const toUserSummary = (value: PopulatedUser): ChatUserSummary => ({
	id: value._id?.toString?.() || value.toString?.() || "",
	name: value.name ?? "Unknown",
	profilePictureId: value.profilePictureId ?? null,
	role: value.role ?? "USER",
});

const collectUsersFromChats = (
	docs: PopulatedChatDocument[],
): ChatUserSummary[] => {
	const users = new Map<string, ChatUserSummary>();
	for (const doc of docs) {
		const user1 = toUserSummary(doc.user1Id as PopulatedUser);
		const user2 = toUserSummary(doc.user2Id as PopulatedUser);
		if (user1.id) users.set(user1.id, user1);
		if (user2.id) users.set(user2.id, user2);
	}
	return [...users.values()];
};

const collectLastMessages = (
	docs: PopulatedChatDocument[],
): Record<
	string,
	{
		id: string;
		senderId: string;
		messageType: "TEXT" | "IMAGE" | "FILE";
		content: string | null;
		mediaId: string | null;
		createdAt: Date;
	}
> => {
	const map: Record<
		string,
		{
			id: string;
			senderId: string;
			messageType: "TEXT" | "IMAGE" | "FILE";
			content: string | null;
			mediaId: string | null;
			createdAt: Date;
		}
	> = {};

	for (const doc of docs) {
		const last = doc.lastMessageId;
		if (!last || !last._id) continue;
		map[doc._id.toString()] = {
			id: last._id.toString?.() ?? "",
			senderId: last.senderId?.toString?.() ?? "",
			messageType: last.messageType ?? "TEXT",
			content: last.content ?? null,
			mediaId:
				typeof last.mediaId === "string"
					? last.mediaId
					: (last.mediaId?.toString?.() ?? null),
			createdAt: last.createdAt ?? new Date(),
		};
	}

	return map;
};

@injectable()
export class MongoChatRepository
	extends AbstractMongoRepository<Chat, ChatDocument>
	implements IChatRepository
{
	constructor() {
		super(ChatModel);
	}

	protected toDomain(doc: ChatDocument): Chat {
		return ChatMapper.toDomain(doc);
	}

	protected toDocument(entity: Chat): Partial<ChatDocument> {
		return ChatMapper.toDocument(entity);
	}

	async create(chat: Chat): Promise<Chat> {
		return this.createDocument(chat);
	}

	async findById(id: string): Promise<Chat | null> {
		return this.findByIdDocument(id);
	}

	async updateById(id: string, update: Partial<Chat>): Promise<Chat | null> {
		const doc = await this.model
			.findByIdAndUpdate(id, update, { returnDocument: "after" })
			.lean();

		return doc ? this.toDomain(doc as ChatDocument) : null;
	}

	async findByUserId(userId: string): Promise<Chat[]> {
		const filter: QueryFilter<ChatDocument> = {
			$or: [{ user1Id: userId }, { user2Id: userId }],
		};

		const docs = await this.model.find(filter).sort({ updatedAt: -1 }).lean();
		return docs.map((doc) => this.toDomain(doc as ChatDocument));
	}

	async findByParticipants(
		user1Id: string,
		user2Id: string,
	): Promise<Chat | null> {
		const filter: QueryFilter<ChatDocument> = {
			$or: [
				{ user1Id, user2Id },
				{ user1Id: user2Id, user2Id: user1Id },
			],
		};

		const doc = await this.model.findOne(filter).lean();
		return doc ? this.toDomain(doc as ChatDocument) : null;
	}

	async findByParticipantsWithUsers(
		user1Id: string,
		user2Id: string,
	): Promise<{ chat: Chat | null; users: ChatUserSummary[] }> {
		const filter: QueryFilter<ChatDocument> = {
			$or: [
				{ user1Id, user2Id },
				{ user1Id: user2Id, user2Id: user1Id },
			],
		};

		const doc = await this.model
			.findOne(filter)
			.populate("user1Id", "name profilePictureId role")
			.populate("user2Id", "name profilePictureId role")
			.lean<PopulatedChatDocument | null>();

		if (!doc) return { chat: null, users: [] };

		return {
			chat: this.toDomain(doc as ChatDocument),
			users: collectUsersFromChats([doc]),
		};
	}

	async listByUserWithUsers(
		userId: string,
		filter: "read" | "unread" | "all",
		cursor: string | null,
		limit: number,
	): Promise<{
		items: Chat[];
		users: ChatUserSummary[];
		lastMessages: Record<
			string,
			{
				id: string;
				senderId: string;
				messageType: "TEXT" | "IMAGE" | "FILE";
				content: string | null;
				mediaId: string | null;
				createdAt: Date;
			}
		>;
		limit: number;
		nextCursor: string | null;
		hasMore: boolean;
	}> {
		const userFilter: QueryFilter<ChatDocument> = {
			$or: [{ user1Id: userId }, { user2Id: userId }],
		};

		const unreadKey = `unreadCount.${userId}`;
		const readFilter: QueryFilter<ChatDocument> =
			filter === "unread"
				? { [unreadKey]: { $gt: 0 } }
				: filter === "read"
					? {
							$or: [{ [unreadKey]: { $exists: false } }, { [unreadKey]: 0 }],
						}
					: {};

		const andFilters: QueryFilter<ChatDocument>[] = [userFilter];
		if (Object.keys(readFilter).length > 0) {
			andFilters.push(readFilter);
		}
		const parsedCursor = decodeCursor(cursor);

		if (parsedCursor) {
			andFilters.push({
				$or: [
					{ updatedAt: { $lt: parsedCursor.timestamp } },
					{
						updatedAt: parsedCursor.timestamp,
						_id: { $lt: new Types.ObjectId(parsedCursor.id) },
					},
				],
			});
		}

		const combinedFilter: QueryFilter<ChatDocument> =
			andFilters.length === 1 ? andFilters[0] : { $and: andFilters };

		const docs = await this.model
			.find(combinedFilter)
			.sort({ updatedAt: -1, _id: -1 })
			.limit(limit + 1)
			.populate("user1Id", "name profilePictureId role")
			.populate("user2Id", "name profilePictureId role")
			.populate(
				"lastMessageId",
				"senderId messageType content mediaId createdAt",
			)
			.lean<PopulatedChatDocument[]>();

		const hasMore = docs.length > limit;
		const pageDocs = docs.slice(0, limit);

		const items = pageDocs.map((doc) => this.toDomain(doc as ChatDocument));
		const users = collectUsersFromChats(pageDocs);
		const lastMessages = collectLastMessages(pageDocs);
		const lastDoc = pageDocs[pageDocs.length - 1];

		return {
			items,
			users,
			lastMessages,
			limit,
			hasMore,
			nextCursor:
				hasMore && lastDoc
					? encodeCursor(lastDoc.updatedAt, lastDoc._id.toString())
					: null,
		};
	}
}

const encodeCursor = (timestamp: Date, id: string): string =>
	Buffer.from(
		JSON.stringify({ timestamp: timestamp.toISOString(), id }),
	).toString("base64url");

const decodeCursor = (
	cursor: string | null,
): { timestamp: Date; id: string } | null => {
	if (!cursor) return null;

	try {
		const parsed = JSON.parse(
			Buffer.from(cursor, "base64url").toString("utf8"),
		) as {
			timestamp?: string;
			id?: string;
		};

		if (!parsed.timestamp || !parsed.id || !Types.ObjectId.isValid(parsed.id)) {
			return null;
		}

		const timestamp = new Date(parsed.timestamp);
		if (Number.isNaN(timestamp.getTime())) return null;

		return { timestamp, id: parsed.id };
	} catch {
		return null;
	}
};
