import { describe, expect, it } from "vitest";
import { MessageSentEvent } from "../../../../src/domain/events/message-sent.event";

describe("MessageSentEvent", () => {
	it("should have correct properties", () => {
		const now = new Date();
		const event = new MessageSentEvent({
			chatId: "chat-1",
			receiverId: "user-2",
			message: {
				id: "msg-1",
				chatId: "chat-1",
				senderId: "user-1",
				messageType: "TEXT",
				content: "Hello",
				attachementId: null,
				mediaUrl: null,
				repliedTo: null,
				status: "send",
				createdAt: now,
				updatedAt: now,
			},
			senderName: "Sender",
			receiverName: "Receiver",
		});

		expect(event.eventName).toBe("chat.message.sent");
		expect(event.payload.message.id).toBe("msg-1");
		expect(event.occurredAt).toBeInstanceOf(Date);
	});
});
