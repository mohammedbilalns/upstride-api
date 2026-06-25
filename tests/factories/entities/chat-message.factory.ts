import { Chatmessage } from "../../../src/domain/entities/chat-message.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createChatMessage(
	overrides: Partial<Chatmessage> = {},
): Chatmessage {
	const data = mergeDefaults<Chatmessage>(
		{
			id: "message-1",
			chatId: "chat-1",
			senderId: "user-1",
			messageType: "TEXT",
			content: "Hello",
			attachementId: null,
			repliedTo: null,
			status: "send",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new Chatmessage(
		data.id,
		data.chatId,
		data.senderId,
		data.messageType,
		data.content,
		data.attachementId,
		data.repliedTo,
		data.status,
		data.createdAt,
		data.updatedAt,
	);
}
