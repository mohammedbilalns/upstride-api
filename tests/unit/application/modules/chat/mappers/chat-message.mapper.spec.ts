import { describe, expect, it } from "vitest";
import { ChatMessageMapper } from "../../../../../../src/application/modules/chat/mappers/chat-message.mapper";
import { Chatmessage } from "../../../../../../src/domain/entities/chat-message.entity";

describe("ChatMessageMapper", () => {
	describe("toDto", () => {
		it("should map text message to DTO", () => {
			const now = new Date();
			const msg = new Chatmessage(
				"msg-1",
				"chat-1",
				"user-1",
				"TEXT",
				"Hello world",
				null,
				null,
				"send",
				now,
				now,
			);

			const result = ChatMessageMapper.toDto(msg);

			expect(result).toEqual({
				id: "msg-1",
				chatId: "chat-1",
				senderId: "user-1",
				messageType: "TEXT",
				content: "Hello world",
				attachementId: null,
				mediaUrl: null,
				repliedTo: null,
				status: "send",
				createdAt: now,
				updatedAt: now,
			});
		});

		it("should map image message with attachment URL", () => {
			const now = new Date();
			const msg = new Chatmessage(
				"msg-2",
				"chat-1",
				"user-2",
				"IMAGE",
				null,
				"attach-1",
				null,
				"read",
				now,
				now,
			);

			const result = ChatMessageMapper.toDto(
				msg,
				"https://example.com/image.jpg",
			);

			expect(result.messageType).toBe("IMAGE");
			expect(result.content).toBeNull();
			expect(result.attachementId).toBe("attach-1");
			expect(result.mediaUrl).toBe("https://example.com/image.jpg");
			expect(result.status).toBe("read");
		});

		it("should handle replied message", () => {
			const now = new Date();
			const msg = new Chatmessage(
				"msg-3",
				"chat-1",
				"user-1",
				"TEXT",
				"Reply content",
				null,
				"msg-1",
				"send",
				now,
				now,
			);

			const result = ChatMessageMapper.toDto(msg);

			expect(result.repliedTo).toBe("msg-1");
		});
	});
});
