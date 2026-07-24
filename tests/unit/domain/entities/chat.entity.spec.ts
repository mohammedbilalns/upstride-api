import { describe, expect, it } from "vitest";
import { Chat } from "../../../../src/domain/entities/chat.entity";

describe("Chat Entity", () => {
	describe("canStartBetween static method", () => {
		it("should allow USER with MENTOR", () => {
			const result = Chat.canStartBetween("USER", "MENTOR");
			expect(result).toBe(true);
		});

		it("should allow MENTOR with USER", () => {
			const result = Chat.canStartBetween("MENTOR", "USER");
			expect(result).toBe(true);
		});

		it("should allow MENTOR with MENTOR", () => {
			const result = Chat.canStartBetween("MENTOR", "MENTOR");
			expect(result).toBe(true);
		});

		it("should not allow USER with USER", () => {
			const result = Chat.canStartBetween("USER", "USER");
			expect(result).toBe(false);
		});

		it("should not allow ADMIN", () => {
			const result = Chat.canStartBetween("ADMIN", "USER");
			expect(result).toBe(false);
		});
	});

	describe("hasParticipant instance method", () => {
		it("should return true for user1", () => {
			const now = new Date();
			const chat = new Chat("c1", "u1", "u2", null, new Map(), now, now);
			expect(chat.hasParticipant("u1")).toBe(true);
		});

		it("should return true for user2", () => {
			const now = new Date();
			const chat = new Chat("c1", "u1", "u2", null, new Map(), now, now);
			expect(chat.hasParticipant("u2")).toBe(true);
		});

		it("should return false for non-participant", () => {
			const now = new Date();
			const chat = new Chat("c1", "u1", "u2", null, new Map(), now, now);
			expect(chat.hasParticipant("u3")).toBe(false);
		});
	});

	describe("markRead instance method", () => {
		it("should set unread to 0", () => {
			const now = new Date();
			const unread = new Map<string, number>();
			unread.set("u1", 5);
			const chat = new Chat("c1", "u1", "u2", null, unread, now, now);

			chat.markRead("u1");
			expect(chat.unreadCount.get("u1")).toBe(0);
		});
	});

	describe("incrementUnreadFor instance method", () => {
		it("should increment receiver and reset sender", () => {
			const now = new Date();
			const unread = new Map<string, number>();
			unread.set("u1", 2);
			unread.set("u2", 3);
			const chat = new Chat("c1", "u1", "u2", null, unread, now, now);

			chat.incrementUnreadFor("u1", "u2");

			expect(chat.unreadCount.get("u1")).toBe(3);
			expect(chat.unreadCount.get("u2")).toBe(0);
		});

		it("should initialize new user", () => {
			const now = new Date();
			const chat = new Chat("c1", "u1", "u2", null, new Map(), now, now);

			chat.incrementUnreadFor("u1", "u2");

			expect(chat.unreadCount.get("u1")).toBe(1);
			expect(chat.unreadCount.get("u2")).toBe(0);
		});
	});

	describe("constructor", () => {
		it("should create chat", () => {
			const now = new Date();
			const chat = new Chat("c1", "u1", "u2", "m1", new Map(), now, now);

			expect(chat.id).toBe("c1");
			expect(chat.user1Id).toBe("u1");
			expect(chat.user2Id).toBe("u2");
			expect(chat.lastMessageId).toBe("m1");
		});
	});
});
