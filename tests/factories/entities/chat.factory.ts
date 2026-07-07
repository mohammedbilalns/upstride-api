import { Chat } from "../../../src/domain/entities/chat.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createChat(overrides: Partial<Chat> = {}): Chat {
	const data = mergeDefaults<Chat>(
		{
			id: "chat-1",
			user1Id: "user-1",
			user2Id: "mentor-1",
			lastMessageId: null,
			unreadCount: new Map([
				["user-1", 0],
				["mentor-1", 0],
			]),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new Chat(
		data.id,
		data.user1Id,
		data.user2Id,
		data.lastMessageId,
		data.unreadCount,
		data.createdAt,
		data.updatedAt,
	);
}
