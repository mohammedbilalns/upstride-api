import { beforeEach, describe, expect, it } from "vitest";
import type { MarkMessagesReadInput } from "../../../../../src/application/modules/chat/dtos/chat.dto";
import {
	ChatAccessDeniedError,
	ChatNotFoundError,
} from "../../../../../src/application/modules/chat/errors";
import { MarkMessagesReadUseCase } from "../../../../../src/application/modules/chat/use-cases/mark-messages-read.use-case";
import type {
	IChatMessageRepository,
	IChatRepository,
} from "../../../../../src/domain/repositories";
import { createChat } from "../../../../factories/entities/chat.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("MarkMessagesReadUseCase", () => {
	let chatRepository: ReturnType<typeof createMock<IChatRepository>>;
	let chatMessageRepository: ReturnType<
		typeof createMock<IChatMessageRepository>
	>;
	let useCase: MarkMessagesReadUseCase;

	const baseInput: MarkMessagesReadInput = {
		chatId: "chat-1",
		readerId: "user-1",
	};

	const mockChat = createChat({
		id: "chat-1",
		user1Id: "user-1",
		user2Id: "mentor-1",
	});

	beforeEach(() => {
		chatRepository = createMock<IChatRepository>();
		chatMessageRepository = createMock<IChatMessageRepository>();
		useCase = new MarkMessagesReadUseCase(
			chatRepository,
			chatMessageRepository,
		);
	});

	it("should throw ChatNotFoundError when chat does not exist", async () => {
		chatRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ChatNotFoundError,
		);

		expect(chatMessageRepository.markAsRead).not.toHaveBeenCalled();
	});

	it("should throw ChatAccessDeniedError when reader is not a participant", async () => {
		const otherChat = createChat({
			id: "chat-1",
			user1Id: "other-1",
			user2Id: "other-2",
		});
		chatRepository.findById.mockResolvedValue(otherChat);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ChatAccessDeniedError,
		);

		expect(chatMessageRepository.markAsRead).not.toHaveBeenCalled();
	});

	it("should mark messages as read and return updated count", async () => {
		chatRepository.findById.mockResolvedValue(mockChat);
		chatMessageRepository.markAsRead.mockResolvedValue(5);

		const result = await useCase.execute(baseInput);

		expect(chatMessageRepository.markAsRead).toHaveBeenCalledWith(
			"chat-1",
			"user-1",
		);
		expect(chatRepository.updateById).toHaveBeenCalledWith("chat-1", {
			unreadCount: expect.any(Map),
		});
		expect(result.updatedCount).toBe(5);
	});

	it("should reset unread count for the reader", async () => {
		const chatWithUnread = createChat({
			id: "chat-1",
			user1Id: "user-1",
			user2Id: "mentor-1",
			unreadCount: new Map([
				["user-1", 3],
				["mentor-1", 0],
			]),
		});
		chatRepository.findById.mockResolvedValue(chatWithUnread);
		chatMessageRepository.markAsRead.mockResolvedValue(3);

		await useCase.execute(baseInput);

		const updateArg = chatRepository.updateById.mock.calls[0][1];
		expect(updateArg.unreadCount?.get("user-1")).toBe(0);
	});

	it("should handle zero updated count", async () => {
		chatRepository.findById.mockResolvedValue(mockChat);
		chatMessageRepository.markAsRead.mockResolvedValue(0);

		const result = await useCase.execute(baseInput);

		expect(result.updatedCount).toBe(0);
	});

	it("should work when reader is user2", async () => {
		const input: MarkMessagesReadInput = { ...baseInput, readerId: "mentor-1" };
		chatRepository.findById.mockResolvedValue(mockChat);
		chatMessageRepository.markAsRead.mockResolvedValue(2);

		const result = await useCase.execute(input);

		expect(chatMessageRepository.markAsRead).toHaveBeenCalledWith(
			"chat-1",
			"mentor-1",
		);
		expect(result.updatedCount).toBe(2);
	});
});
