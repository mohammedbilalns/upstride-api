import type {
	Chatmessage,
	MessageStatus,
} from "../entities/chat-message.entity";
import type {
	CreatableRepository,
	FindByIdRepository,
	QueryableRepository,
	UpdatableByIdRepository,
} from "./capabilities";

export interface ChatMessageQuery {
	chatId?: string;
	senderId?: string;
	status?: MessageStatus;
}

export interface IChatMessageRepository
	extends CreatableRepository<Chatmessage>,
		FindByIdRepository<Chatmessage>,
		QueryableRepository<Chatmessage, ChatMessageQuery>,
		UpdatableByIdRepository<Chatmessage> {
	listByChatId(
		chatId: string,
		cursor: string | null,
		limit: number,
	): Promise<{
		items: Chatmessage[];
		limit: number;
		nextCursor: string | null;
		hasMore: boolean;
	}>;
	markAsRead(chatId: string, readerId: string): Promise<number>;
}
