import { beforeEach, describe, expect, it } from "vitest";
import type {
	GetChatsInput,
	GetChatsOutput,
} from "../../../../src/application/modules/chat/dtos/chat.dto";
import { GetChatsUseCase } from "../../../../src/application/modules/chat/use-cases/get-chats.use-case";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type { IChatRepository } from "../../../../src/domain/repositories";
import { createChat } from "../../../factories/entities/chat.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetChatsUseCase", () => {
	let chatRepository: ReturnType<typeof createMock<IChatRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetChatsUseCase;

	const baseInput: GetChatsInput = {
		userId: "user-1",
		page: 1,
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
		chatRepository.paginateByUserWithUsers.mockResolvedValue({
			items: mockChats,
			total: 2,
			page: 1,
			limit: 10,
			users: [mockUser, mockMentor],
			lastMessages: new Map(),
		});

		const result = await useCase.execute(baseInput);

		expect(chatRepository.paginateByUserWithUsers).toHaveBeenCalledWith(
			"user-1",
			"all",
			1,
			10,
		);
		expect(result.chats).toHaveLength(2);
		expect(result.total).toBe(2);
	});

	it("should filter chats by read status", async () => {
		chatRepository.paginateByUserWithUsers.mockResolvedValue({
			items: mockChats,
			total: 2,
			page: 1,
			limit: 10,
			users: [mockUser, mockMentor],
			lastMessages: new Map(),
		});

		await useCase.execute({ ...baseInput, filter: "unread" });

		expect(chatRepository.paginateByUserWithUsers).toHaveBeenCalledWith(
			"user-1",
			"unread",
			1,
			10,
		);
	});

	it("should generate signed URLs for user profile pictures", async () => {
		chatRepository.paginateByUserWithUsers.mockResolvedValue({
			items: mockChats,
			total: 2,
			page: 1,
			limit: 10,
			users: [mockUser, mockMentor],
			lastMessages: new Map(),
		});

		const result = await useCase.execute(baseInput);

		expect(storageService.getPublicUrl).toHaveBeenCalledWith("pic-1");
		expect(result.chats[0].receiver.profilePictureUrl).toBe(
			"https://storage.example.com/pic-1",
		);
	});

	it("should return empty array when no chats exist", async () => {
		chatRepository.paginateByUserWithUsers.mockResolvedValue({
			items: [],
			total: 0,
			page: 1,
			limit: 10,
			users: [],
			lastMessages: new Map(),
		});

		const result = await useCase.execute(baseInput);

		expect(result.chats).toHaveLength(0);
		expect(result.total).toBe(0);
	});
});
