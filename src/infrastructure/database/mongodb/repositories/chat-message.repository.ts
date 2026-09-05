import { injectable } from "inversify";
import { type QueryFilter, Types } from "mongoose";
import type { Chatmessage } from "../../../../domain/entities/chat-message.entity";
import type { PaginateParams } from "../../../../domain/repositories";
import type { QueryParams } from "../../../../domain/repositories/capabilities";
import type { PaginatedResult } from "../../../../domain/repositories/capabilities/paginatable.repository.interface";
import type {
	ChatMessageQuery,
	IChatMessageRepository,
} from "../../../../domain/repositories/chat-message.repository.interface";
import { ChatMessageMapper } from "../mappers/chat-message.mapper";
import {
	type ChatMessageDocument,
	ChatMessageModel,
} from "../models/chat-message.model";
import { AbstractMongoRepository } from "./abstract.repository";

@injectable()
export class MongoChatMessageRepository
	extends AbstractMongoRepository<Chatmessage, ChatMessageDocument>
	implements IChatMessageRepository
{
	constructor() {
		super(ChatMessageModel);
	}

	protected toDomain(doc: ChatMessageDocument): Chatmessage {
		return ChatMessageMapper.toDomain(doc);
	}

	protected toDocument(entity: Chatmessage): Partial<ChatMessageDocument> {
		return ChatMessageMapper.toDocument(entity);
	}

	async create(message: Chatmessage): Promise<Chatmessage> {
		return this.createDocument(message);
	}

	async findById(id: string): Promise<Chatmessage | null> {
		return this.findByIdDocument(id);
	}

	async updateById(
		id: string,
		update: Partial<Chatmessage>,
	): Promise<Chatmessage | null> {
		const doc = await this.model
			.findByIdAndUpdate(id, update, { returnDocument: "after" })
			.lean();

		return doc ? this.toDomain(doc as ChatMessageDocument) : null;
	}

	async query({
		query,
		sort,
	}: QueryParams<ChatMessageQuery>): Promise<Chatmessage[]> {
		const filter = this._buildFilter(query);

		const docs = await this.model
			.find(filter)
			.sort(sort ?? { createdAt: -1 })
			.lean();

		return docs.map((doc) => this.toDomain(doc as ChatMessageDocument));
	}

	async paginate({
		page,
		limit,
		query,
		sort,
	}: PaginateParams<ChatMessageQuery>): Promise<PaginatedResult<Chatmessage>> {
		const filter = this._buildFilter(query);
		const skip = (page - 1) * limit;

		const [docs, total] = await Promise.all([
			this.model
				.find(filter)
				.sort(sort ?? { createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			this.model.countDocuments(filter),
		]);

		const items = docs.map((doc) => this.toDomain(doc as ChatMessageDocument));

		return this.buildPaginatedResult(items, total, page, limit);
	}

	async listByChatId(
		chatId: string,
		cursor: string | null,
		limit: number,
	): Promise<{
		items: Chatmessage[];
		limit: number;
		nextCursor: string | null;
		hasMore: boolean;
	}> {
		const filter = this._buildFilter({ chatId });
		const parsedCursor = decodeCursor(cursor);

		if (parsedCursor) {
			filter.$or = [
				{ createdAt: { $lt: parsedCursor.timestamp } },
				{
					createdAt: parsedCursor.timestamp,
					_id: { $lt: new Types.ObjectId(parsedCursor.id) },
				},
			];
		}

		const docs = await this.model
			.find(filter)
			.sort({ createdAt: -1, _id: -1 })
			.limit(limit + 1)
			.lean();

		const hasMore = docs.length > limit;
		const items = docs
			.slice(0, limit)
			.map((doc) => this.toDomain(doc as ChatMessageDocument));
		const lastDoc = docs[limit - 1] as ChatMessageDocument | undefined;

		return {
			items,
			limit,
			hasMore,
			nextCursor:
				hasMore && lastDoc
					? encodeCursor(lastDoc.createdAt, lastDoc._id.toString())
					: null,
		};
	}

	private _buildFilter(
		query?: ChatMessageQuery,
	): QueryFilter<ChatMessageDocument> {
		const filter: QueryFilter<ChatMessageDocument> = {};

		if (!query) return filter;

		Object.assign(filter, {
			...(query.chatId && { chatId: query.chatId }),
			...(query.senderId && { senderId: query.senderId }),
			...(query.status && { status: query.status }),
		});

		return filter;
	}

	async markAsRead(chatId: string, readerId: string): Promise<number> {
		const result = await this.model.updateMany(
			{ chatId, senderId: { $ne: readerId }, status: "send" },
			{ status: "read" },
		);

		return result.modifiedCount ?? 0;
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
