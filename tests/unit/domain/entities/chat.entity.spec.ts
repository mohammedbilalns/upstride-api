import { describe, expect, it } from "vitest";
import { Chat } from "../../../../src/domain/entities/chat.entity";

describe("Chat Entity", () => {
	describe("canStartBetween", () => {
		it("should allow chat between USER and MENTOR", () => {
			expect(Chat.canStartBetween("USER", "MENTOR")).toBe(true);
			expect(Chat.canStartBetween("MENTOR", "USER")).toBe(true);
		});

		it("should not allow chat between two USERs", () => {
			expect(Chat.canStartBetween("USER", "USER")).toBe(false);
		});

		it("should allow chat between two MENTORs", () => {
			expect(Chat.canStartBetween("MENTOR", "MENTOR")).toBe(true);
		});

		it("should not allow chat with ADMIN", () => {
			expect(Chat.canStartBetween("USER", "ADMIN")).toBe(false);
			expect(Chat.canStartBetween("MENTOR", "ADMIN")).toBe(false);
			expect(Chat.canStartBetween("ADMIN", "USER")).toBe(false);
			expect(Chat.canStartBetween("ADMIN", "MENTOR")).toBe(false);
		});

		it("should not allow chat with SUPER_ADMIN", () => {
			expect(Chat.canStartBetween("USER", "SUPER_ADMIN")).toBe(false);
			expect(Chat.canStartBetween("MENTOR", "SUPER_ADMIN")).toBe(false);
			expect(Chat.canStartBetween("SUPER_ADMIN", "USER")).toBe(false);
			expect(Chat.canStartBetween("SUPER_ADMIN", "MENTOR")).toBe(false);
		});

		it("should not allow chat between ADMIN and SUPER_ADMIN", () => {
			expect(Chat.canStartBetween("ADMIN", "SUPER_ADMIN")).toBe(false);
		});
	});

	describe("constructor", () => {
		it("should create a valid chat", () => {
			const now = new Date();
			const unreadCount = new Map([["user-1", 0]]);

			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				"message-1",
				unreadCount,
				now,
				now,
			);

			expect(chat.id).toBe("chat-1");
			expect(chat.user1Id).toBe("user-1");
			expect(chat.user2Id).toBe("mentor-1");
			expect(chat.lastMessageId).toBe("message-1");
			expect(chat.unreadCount).toEqual(unreadCount);
		});

		it("should allow null lastMessageId", () => {
			const now = new Date();
			const unreadCount = new Map();

			const chat = new Chat(
				"chat-2",
				"user-1",
				"mentor-1",
				null,
				unreadCount,
				now,
				now,
			);

			expect(chat.lastMessageId).toBeNull();
		});
	});

	describe("hasParticipant", () => {
		it("should return true when userId is user1", () => {
			const now = new Date();
			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				new Map(),
				now,
				now,
			);

			expect(chat.hasParticipant("user-1")).toBe(true);
		});

		it("should return true when userId is user2", () => {
			const now = new Date();
			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				new Map(),
				now,
				now,
			);

			expect(chat.hasParticipant("mentor-1")).toBe(true);
		});

		it("should return false when userId is neither participant", () => {
			const now = new Date();
			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				new Map(),
				now,
				now,
			);

			expect(chat.hasParticipant("user-3")).toBe(false);
		});

		it("should return false for empty string userId", () => {
			const now = new Date();
			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				new Map(),
				now,
				now,
			);

			expect(chat.hasParticipant("")).toBe(false);
		});
	});

	describe("markRead", () => {
		it("should reset unread count to zero for user", () => {
			const now = new Date();
			const unreadCount = new Map([
				["user-1", 5],
				["mentor-1", 3],
			]);

			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				unreadCount,
				now,
				now,
			);

			chat.markRead("user-1");

			expect(chat.unreadCount.get("user-1")).toBe(0);
			expect(chat.unreadCount.get("mentor-1")).toBe(3);
		});

		it("should handle marking read when user not in map", () => {
			const now = new Date();
			const unreadCount = new Map([["mentor-1", 3]]);

			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				unreadCount,
				now,
				now,
			);

			chat.markRead("user-1");

			expect(chat.unreadCount.get("user-1")).toBe(0);
		});

		it("should not affect other users", () => {
			const now = new Date();
			const unreadCount = new Map([
				["user-1", 5],
				["mentor-1", 3],
				["user-3", 2],
			]);

			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				unreadCount,
				now,
				now,
			);

			chat.markRead("user-1");

			expect(chat.unreadCount.get("user-1")).toBe(0);
			expect(chat.unreadCount.get("mentor-1")).toBe(3);
			expect(chat.unreadCount.get("user-3")).toBe(2);
		});
	});

	describe("incrementUnreadFor", () => {
		it("should increment unread for receiver and reset sender", () => {
			const now = new Date();
			const unreadCount = new Map([
				["user-1", 5],
				["mentor-1", 0],
			]);

			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				unreadCount,
				now,
				now,
			);

			chat.incrementUnreadFor("mentor-1", "user-1");

			expect(chat.unreadCount.get("mentor-1")).toBe(1);
			expect(chat.unreadCount.get("user-1")).toBe(0);
		});

		it("should increment from zero if receiver not in map", () => {
			const now = new Date();
			const unreadCount = new Map([["user-1", 0]]);

			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				unreadCount,
				now,
				now,
			);

			chat.incrementUnreadFor("mentor-1", "user-1");

			expect(chat.unreadCount.get("mentor-1")).toBe(1);
		});

		it("should handle multiple increments", () => {
			const now = new Date();
			const unreadCount = new Map([
				["user-1", 0],
				["mentor-1", 0],
			]);

			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				unreadCount,
				now,
				now,
			);

			chat.incrementUnreadFor("mentor-1", "user-1");
			chat.incrementUnreadFor("mentor-1", "user-1");
			chat.incrementUnreadFor("mentor-1", "user-1");

			expect(chat.unreadCount.get("mentor-1")).toBe(3);
			expect(chat.unreadCount.get("user-1")).toBe(0);
		});

		it("should reset sender even if sender has high unread", () => {
			const now = new Date();
			const unreadCount = new Map([
				["user-1", 10],
				["mentor-1", 0],
			]);

			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				unreadCount,
				now,
				now,
			);

			chat.incrementUnreadFor("mentor-1", "user-1");

			expect(chat.unreadCount.get("user-1")).toBe(0);
			expect(chat.unreadCount.get("mentor-1")).toBe(1);
		});

		it("should add sender to map if not present", () => {
			const now = new Date();
			const unreadCount = new Map([["mentor-1", 5]]);

			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				unreadCount,
				now,
				now,
			);

			chat.incrementUnreadFor("mentor-1", "user-1");

			expect(chat.unreadCount.get("user-1")).toBe(0);
		});
	});
});
