import type { Chat } from "../entities/chat.entity";
import type { UserRole } from "../entities/user.entity";
import type {
	CreatableRepository,
	FindByIdRepository,
	UpdatableByIdRepository,
} from "./capabilities";

export interface ChatUserSummary {
	id: string;
	name: string;
	profilePictureId?: string | null;
	role?: UserRole;
}

export interface IChatRepository
	extends CreatableRepository<Chat>,
		FindByIdRepository<Chat>,
		UpdatableByIdRepository<Chat> {
	findByUserId(userId: string): Promise<Chat[]>;
	findByParticipants(user1Id: string, user2Id: string): Promise<Chat | null>;
	findByParticipantsWithUsers(
		user1Id: string,
		user2Id: string,
	): Promise<{ chat: Chat | null; users: ChatUserSummary[] }>;
	listByUserWithUsers(
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
	}>;
}
