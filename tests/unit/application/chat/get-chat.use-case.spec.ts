import { beforeEach, describe, expect, it } from "vitest";
import type { GetChatInput } from "../../../../src/application/modules/chat/dtos/chat.dto";
import { ChatNotFoundError } from "../../../../src/application/modules/chat/errors";
import { GetChatUseCase } from "../../../../src/application/modules/chat/use-cases/get-chat.use-case";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type {
	IChatMessageRepository,
	IChatRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import { createChat } from "../../../factories/entities/chat.factory";
import { createChatMessage } from "../../../factories/entities/chat-message.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetChatUseCase", () => {
	let chatRepository: ReturnType<typeof createMock<IChatRepository>>;
	let chatMessageRepository: ReturnType<
		typeof createMock<IChatMessageRepository>
	>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetChatUseCase;

	beforeEach(() => {
		chatRepository = createMock<IChatRepository>();
		chatMessageRepository = createMock<IChatMessageRepository>();
		userRepository = createMock<IUserRepository>();
		storageService = createMock<IStorageService>();

		useCase = new GetChatUseCase(
			chatRepository,
			chatMessageRepository,
			userRepository,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(key: string) => `https://storage.example.com/${key}`,
		);
		storageService.getSignedUrl.mockResolvedValue(
			"https://signed.example.com/file",
		);
	});

	const baseInput: GetChatInput = {
		userId: "user-1",
		otherUserId: "mentor-1",
		page: 1,
	};

	const mockChat = createChat({
		id: "chat-1",
		user1Id: "user-1",
		user2Id: "mentor-1",
	});
	const mockUsers = [
		createUser({ id: "user-1", name: "User One", role: "USER" }),
		createUser({
			id: "mentor-1",
			name: "Mentor One",
			role: "MENTOR",
			profilePictureId: "pic-1",
		}),
	];
	const mockMessages = [
		createChatMessage({
			id: "msg-1",
			chatId: "chat-1",
			senderId: "mentor-1",
			content: "Hello",
		}),
		createChatMessage({
			id: "msg-2",
			chatId: "chat-1",
			senderId: "user-1",
			content: "Hi there",
		}),
	];

	it("should throw ChatNotFoundError when chat does not exist", async () => {
		chatRepository.findByParticipantsWithUsers.mockResolvedValue({
			chat: null,
			users: [],
		});

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ChatNotFoundError,
		);
	});

	it("should return chat with messages and receiver info", async () => {
		chatRepository.findByParticipantsWithUsers.mockResolvedValue({
			chat: mockChat,
			users: mockUsers,
		});
		chatMessageRepository.paginate.mockResolvedValue({
			items: mockMessages,
			total: 2,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		chatMessageRepository.markAsRead.mockResolvedValue(0);

		const result = await useCase.execute(baseInput);

		expect(result.chat?.id).toBe("chat-1");
		expect(result.receiver).not.toBeNull();
		expect(result.receiver?.name).toBe("Mentor One");
		expect(result.messages).toHaveLength(2);
		expect(result.total).toBe(2);
	});

	it("should mark messages as read and update unread count", async () => {
		chatRepository.findByParticipantsWithUsers.mockResolvedValue({
			chat: mockChat,
			users: mockUsers,
		});
		chatMessageRepository.paginate.mockResolvedValue({
			items: mockMessages,
			total: 2,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		chatMessageRepository.markAsRead.mockResolvedValue(2);

		await useCase.execute(baseInput);

		expect(chatMessageRepository.markAsRead).toHaveBeenCalledWith(
			"chat-1",
			"user-1",
		);
		expect(chatRepository.updateById).toHaveBeenCalledWith(
			"chat-1",
			expect.objectContaining({
				unreadCount: expect.any(Map),
			}),
		);
	});

	it("should fetch user from repository if not in initial users list", async () => {
		const usersWithoutReceiver = [mockUsers[0]];
		chatRepository.findByParticipantsWithUsers.mockResolvedValue({
			chat: mockChat,
			users: usersWithoutReceiver,
		});
		userRepository.findById.mockResolvedValue(mockUsers[1]);
		chatMessageRepository.paginate.mockResolvedValue({
			items: mockMessages,
			total: 2,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		chatMessageRepository.markAsRead.mockResolvedValue(0);

		await useCase.execute(baseInput);

		expect(userRepository.findById).toHaveBeenCalledWith("mentor-1");
	});

	it("should sign media URLs for messages with attachments", async () => {
		const messageWithMedia = createChatMessage({
			id: "msg-3",
			attachementId: "file-1",
			content: "File",
		});
		chatRepository.findByParticipantsWithUsers.mockResolvedValue({
			chat: mockChat,
			users: mockUsers,
		});
		chatMessageRepository.paginate.mockResolvedValue({
			items: [messageWithMedia],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		chatMessageRepository.markAsRead.mockResolvedValue(0);

		const result = await useCase.execute(baseInput);

		expect(storageService.getSignedUrl).toHaveBeenCalledWith("file-1");
		expect(result.messages[0].mediaUrl).toBe("https://signed.example.com/file");
	});

	it("should use default page when not provided", async () => {
		const inputWithoutPage: GetChatInput = {
			userId: "user-1",
			otherUserId: "mentor-1",
		};
		chatRepository.findByParticipantsWithUsers.mockResolvedValue({
			chat: mockChat,
			users: mockUsers,
		});
		chatMessageRepository.paginate.mockResolvedValue({
			items: [],
			total: 0,
			page: 1,
			limit: 10,
			totalPages: 0,
		});
		chatMessageRepository.markAsRead.mockResolvedValue(0);

		await useCase.execute(inputWithoutPage);

		expect(chatMessageRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				page: 1,
			}),
		);
	});
});
