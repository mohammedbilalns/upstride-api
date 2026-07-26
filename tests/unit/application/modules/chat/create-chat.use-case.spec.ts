import { beforeEach, describe, expect, it } from "vitest";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import type { CreateChatInput } from "../../../../../src/application/modules/chat/dtos/chat.dto";
import { ChatNotAllowedError } from "../../../../../src/application/modules/chat/errors";
import { CreateChatUseCase } from "../../../../../src/application/modules/chat/use-cases/create-chat.use-case";
import type { IIdGenerator } from "../../../../../src/application/services/id-generator.service.interface";
import type { IStorageService } from "../../../../../src/application/services/storage.service.interface";
import type {
	IChatRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createChat } from "../../../../factories/entities/chat.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("CreateChatUseCase", () => {
	let chatRepository: ReturnType<typeof createMock<IChatRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: CreateChatUseCase;

	const baseInput: CreateChatInput = {
		userId: "user-1",
		otherUserId: "mentor-1",
	};

	const mockUser = createUser({ id: "user-1", name: "User One", role: "USER" });
	const mockMentor = createUser({
		id: "mentor-1",
		name: "Mentor One",
		role: "MENTOR",
		profilePictureId: "pic-1",
	});
	const mockChat = createChat({
		id: "chat-1",
		user1Id: "user-1",
		user2Id: "mentor-1",
	});

	beforeEach(() => {
		chatRepository = createMock<IChatRepository>();
		userRepository = createMock<IUserRepository>();
		idGenerator = createMock<IIdGenerator>();
		storageService = createMock<IStorageService>();

		useCase = new CreateChatUseCase(
			chatRepository,
			userRepository,
			idGenerator,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(key: string) => `https://storage.example.com/${key}`,
		);
		idGenerator.generate.mockReturnValue("chat-1");
		chatRepository.findByParticipants.mockResolvedValue(null);
		chatRepository.create.mockResolvedValue(mockChat);
	});

	it("should throw UserNotFoundError when user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);
		userRepository.findById
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(mockMentor);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw UserNotFoundError when other user does not exist", async () => {
		userRepository.findById
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw ChatNotAllowedError when both users are not mentor/user pair", async () => {
		const regularUser = createUser({ id: "user-2", role: "USER" });
		userRepository.findById
			.mockResolvedValueOnce(regularUser)
			.mockResolvedValueOnce(mockUser);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ChatNotAllowedError,
		);
	});

	it("should return existing chat if one exists between users", async () => {
		const existingChat = createChat({
			id: "existing-chat",
			user1Id: "user-1",
			user2Id: "mentor-1",
		});
		userRepository.findById
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(mockMentor);
		chatRepository.findByParticipants.mockResolvedValue(existingChat);

		const result = await useCase.execute(baseInput);

		expect(result.chat.id).toBe("existing-chat");
		expect(chatRepository.create).not.toHaveBeenCalled();
	});

	it("should create new chat when none exists", async () => {
		userRepository.findById
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(mockMentor);
		chatRepository.findByParticipants.mockResolvedValue(null);
		chatRepository.create.mockResolvedValue(mockChat);

		const result = await useCase.execute(baseInput);

		expect(chatRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				user1Id: "user-1",
				user2Id: "mentor-1",
			}),
		);
		expect(result.chat.id).toBe("chat-1");
	});

	it("should generate signed URL for mentor profile picture", async () => {
		userRepository.findById
			.mockResolvedValueOnce(mockUser)
			.mockResolvedValueOnce(mockMentor);
		chatRepository.findByParticipants.mockResolvedValue(null);
		chatRepository.create.mockResolvedValue(mockChat);

		await useCase.execute(baseInput);

		expect(storageService.getPublicUrl).toHaveBeenCalledWith("pic-1");
	});
});
