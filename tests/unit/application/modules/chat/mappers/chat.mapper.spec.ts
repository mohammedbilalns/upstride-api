import { describe, expect, it } from "vitest";
import { ChatMapper } from "../../../../../../src/application/modules/chat/mappers/chat.mapper";
import { Chat } from "../../../../../../src/domain/entities/chat.entity";

describe("ChatMapper", () => {
	describe("toDtoForUser", () => {
		it("should map chat entity to DTO", () => {
			const now = new Date();
			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				"msg-1",
				new Map([
					["user-1", 2],
					["mentor-1", 0],
				]),
				now,
				now,
			);

			const usersById = new Map([
				["user-1", { id: "user-1", name: "User 1", profilePictureUrl: "url1" }],
				[
					"mentor-1",
					{ id: "mentor-1", name: "Mentor 1", profilePictureUrl: "url2" },
				],
			]);

			const result = ChatMapper.toDtoForUser(chat, "user-1", usersById);

			expect(result).toEqual({
				id: "chat-1",
				senderId: "user-1",
				receiverId: "mentor-1",
				sender: { id: "user-1", name: "User 1", profilePictureUrl: "url1" },
				receiver: {
					id: "mentor-1",
					name: "Mentor 1",
					profilePictureUrl: "url2",
				},
				lastMessageId: "msg-1",
				lastMessage: null,
				unreadCount: { "user-1": 2, "mentor-1": 0 },
				createdAt: now,
				updatedAt: now,
			});
		});

		it("should handle current user as user2", () => {
			const now = new Date();
			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				null,
				new Map([["mentor-1", 5]]),
				now,
				now,
			);

			const usersById = new Map([
				["user-1", { id: "user-1", name: "User 1", profilePictureUrl: "url1" }],
				[
					"mentor-1",
					{ id: "mentor-1", name: "Mentor 1", profilePictureUrl: "url2" },
				],
			]);

			const result = ChatMapper.toDtoForUser(chat, "mentor-1", usersById);

			expect(result.senderId).toBe("mentor-1");
			expect(result.receiverId).toBe("user-1");
			expect(result.receiver.name).toBe("User 1");
			expect(result.unreadCount).toEqual({ "mentor-1": 5 });
			expect(result.lastMessageId).toBeNull();
		});

		it("should handle missing unread count", () => {
			const now = new Date();
			const chat = new Chat(
				"chat-1",
				"user-1",
				"mentor-1",
				"msg-1",
				new Map(), // Empty map
				now,
				now,
			);

			const usersById = new Map([
				["user-1", { id: "user-1", name: "User 1", profilePictureUrl: "url1" }],
				[
					"mentor-1",
					{ id: "mentor-1", name: "Mentor 1", profilePictureUrl: "url2" },
				],
			]);

			const result = ChatMapper.toDtoForUser(chat, "user-1", usersById);

			expect(result.unreadCount).toEqual({});
		});
	});
});
