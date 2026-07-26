import { describe, expect, it } from "vitest";
import { Chatmessage } from "../../../../src/domain/entities/chat-message.entity";

describe("ChatMessage Entity", () => {
	describe("constructor", () => {
		it("should create a valid text message", () => {
			const now = new Date();
			const message = new Chatmessage(
				"msg-1",
				"chat-1",
				"user-1",
				"TEXT",
				"Hello, how are you?",
				null,
				null,
				"send",
				now,
				now,
			);

			expect(message.id).toBe("msg-1");
			expect(message.chatId).toBe("chat-1");
			expect(message.senderId).toBe("user-1");
			expect(message.messageType).toBe("TEXT");
			expect(message.content).toBe("Hello, how are you?");
			expect(message.status).toBe("send");
		});

		it("should create an image message", () => {
			const now = new Date();
			const message = new Chatmessage(
				"msg-2",
				"chat-1",
				"user-2",
				"IMAGE",
				null,
				"attachment-1",
				null,
				"send",
				now,
				now,
			);

			expect(message.messageType).toBe("IMAGE");
			expect(message.content).toBeNull();
			expect(message.attachementId).toBe("attachment-1");
		});

		it("should create a file message", () => {
			const now = new Date();
			const message = new Chatmessage(
				"msg-3",
				"chat-1",
				"user-1",
				"FILE",
				null,
				"file-1",
				null,
				"send",
				now,
				now,
			);

			expect(message.messageType).toBe("FILE");
			expect(message.attachementId).toBe("file-1");
		});

		it("should create a reply message", () => {
			const now = new Date();
			const message = new Chatmessage(
				"msg-4",
				"chat-1",
				"user-2",
				"TEXT",
				"Thanks!",
				null,
				"msg-1",
				"send",
				now,
				now,
			);

			expect(message.repliedTo).toBe("msg-1");
			expect(message.content).toBe("Thanks!");
		});

		it("should handle read status", () => {
			const now = new Date();
			const message = new Chatmessage(
				"msg-5",
				"chat-1",
				"user-1",
				"TEXT",
				"Old message",
				null,
				null,
				"read",
				now,
				now,
			);

			expect(message.status).toBe("read");
		});

		it("should track timestamps", () => {
			const createdAt = new Date("2026-07-20");
			const updatedAt = new Date("2026-07-24");

			const message = new Chatmessage(
				"msg-6",
				"chat-1",
				"user-1",
				"TEXT",
				"Edited message",
				null,
				null,
				"send",
				createdAt,
				updatedAt,
			);

			expect(message.createdAt).toEqual(createdAt);
			expect(message.updatedAt).toEqual(updatedAt);
		});

		it("should allow long text content", () => {
			const now = new Date();
			const longText =
				"This is a very long message that contains multiple lines and details.".repeat(
					10,
				);

			const message = new Chatmessage(
				"msg-7",
				"chat-1",
				"user-1",
				"TEXT",
				longText,
				null,
				null,
				"send",
				now,
				now,
			);

			expect(message.content).toBe(longText);
		});

		it("should handle empty text message", () => {
			const now = new Date();
			const message = new Chatmessage(
				"msg-8",
				"chat-1",
				"user-1",
				"TEXT",
				"",
				null,
				null,
				"send",
				now,
				now,
			);

			expect(message.content).toBe("");
		});

		it("should allow null content for non-text messages", () => {
			const now = new Date();
			const message = new Chatmessage(
				"msg-9",
				"chat-1",
				"user-1",
				"IMAGE",
				null,
				"image-file-1",
				null,
				"send",
				now,
				now,
			);

			expect(message.content).toBeNull();
			expect(message.attachementId).not.toBeNull();
		});

		it("should support all message types", () => {
			const now = new Date();
			const types = ["TEXT", "IMAGE", "FILE"] as const;

			types.forEach((type) => {
				const message = new Chatmessage(
					`msg-${type}`,
					"chat-1",
					"user-1",
					type,
					type === "TEXT" ? "content" : null,
					type !== "TEXT" ? "attachment-1" : null,
					null,
					"send",
					now,
					now,
				);

				expect(message.messageType).toBe(type);
			});
		});
	});
});
