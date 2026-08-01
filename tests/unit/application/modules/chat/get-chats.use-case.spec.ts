import { beforeEach, describe, expect, it } from "vitest";
import type { GetChatsInput } from "../../../../../src/application/modules/chat/dtos/chat.dto";
import { GetChatsUseCase } from "../../../../../src/application/modules/chat/use-cases/get-chats.use-case";
import type { IStorageService } from "../../../../../src/application/services/storage.service.interface";
import type { IChatRepository } from "../../../../../src/domain/repositories";
import { createChat } from "../../../../factories/entities/chat.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetChatsUseCase", () => {
	let chatRepository: ReturnType<typeof createMock<IChatRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetChatsUseCase;

	const baseInput: GetChatsInput = {
		userId: "user-1",
		filter: "all",
	};

	const mockUser = createUser({ id: "user-1", name: "User One", role: "USER" });
	const mockMentor = createUser({
		id: "mentor-1",
		name: "Mentor One",
		role: "MENTOR",
		profilePictureId: "pic-1",
	});
	const mockChats = [
		createChat({ id: "chat-1", user1Id: "user-1", user2Id: "mentor-1" }),
		createChat({ id: "chat-2", user1Id: "user-1", user2Id: "mentor-2" }),
	];

	beforeEach(() => {
		chatRepository = createMock<IChatRepository>();
		storageService = createMock<IStorageService>();

		useCase = new GetChatsUseCase(chatRepository, storageService);

		storageService.getPublicUrl.mockImplementation(
			(key: string) => `https://storage.example.com/${key}`,
		);
	});

	it("should return paginated chats for user", async () => {
		chatRepository.listByUserWithUsers.mockResolvedValue({
			items: mockChats,
			limit: 10,
			nextCursor: "next-cursor",
			hasMore: true,
			users: [mockUser, mockMentor],
			lastMessages: {},
		});

		const result = await useCase.execute(baseInput);

		expect(chatRepository.listByUserWithUsers).toHaveBeenCalledWith(
			"user-1",
			"all",
			null,
			10,
		);
		expect(result.chats).toHaveLength(2);
		expect(result.nextCursor).toBe("next-cursor");
		expect(result.hasMore).toBe(true);
	});

	it("should filter chats by read status", async () => {
		chatRepository.listByUserWithUsers.mockResolvedValue({
			items: mockChats,
			limit: 10,
			nextCursor: null,
			hasMore: false,
			users: [mockUser, mockMentor],
			lastMessages: {},
		});

		await useCase.execute({ ...baseInput, filter: "unread" });

		expect(chatRepository.listByUserWithUsers).toHaveBeenCalledWith(
			"user-1",
			"unread",
			null,
			10,
		);
	});

	it("should generate signed URLs for user profile pictures", async () => {
		chatRepository.listByUserWithUsers.mockResolvedValue({
			items: mockChats,
			limit: 10,
			nextCursor: null,
			hasMore: false,
			users: [mockUser, mockMentor],
			lastMessages: {},
		});

		const result = await useCase.execute(baseInput);

		expect(storageService.getPublicUrl).toHaveBeenCalledWith("pic-1");
		expect(result.chats[0].receiver.profilePictureUrl).toBe(
			"https://storage.example.com/pic-1",
		);
	});

	it("should return empty array when no chats exist", async () => {
		chatRepository.listByUserWithUsers.mockResolvedValue({
			items: [],
			limit: 10,
			nextCursor: null,
			hasMore: false,
			users: [],
			lastMessages: {},
		});

		const result = await useCase.execute(baseInput);

		expect(result.chats).toHaveLength(0);
		expect(result.hasMore).toBe(false);
	});
});
