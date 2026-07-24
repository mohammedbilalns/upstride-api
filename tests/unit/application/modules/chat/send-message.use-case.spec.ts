import { beforeEach, describe, expect, it } from "vitest";
import type { EventBus } from "../../../../../src/application/events/event-bus.interface";
import type {
	ChatDto,
	SendMessageInput,
} from "../../../../../src/application/modules/chat/dtos/chat.dto";
import {
	ChatAccessDeniedError,
	ChatNotFoundError,
	InvalidMessageError,
} from "../../../../../src/application/modules/chat/errors";
import type { ICreateChatUseCase } from "../../../../../src/application/modules/chat/use-cases/create-chat.use-case.interface";
import { SendMessageUseCase } from "../../../../../src/application/modules/chat/use-cases/send-message.use-case";
import type { IIdGenerator } from "../../../../../src/application/services/id-generator.service.interface";
import type {
	IChatMessageRepository,
	IChatRepository,
} from "../../../../../src/domain/repositories";
import { createChat } from "../../../../factories/entities/chat.factory";
import { createChatMessage } from "../../../../factories/entities/chat-message.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("SendMessageUseCase", () => {
	let chatRepository: ReturnType<typeof createMock<IChatRepository>>;
	let chatMessageRepository: ReturnType<
		typeof createMock<IChatMessageRepository>
	>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let createChatUseCase: ReturnType<typeof createMock<ICreateChatUseCase>>;
	let eventBus: ReturnType<typeof createMock<EventBus>>;
	let useCase: SendMessageUseCase;

	const baseInput: SendMessageInput = {
		chatId: "chat-1",
		senderId: "user-1",
		content: "Hello mentor!",
	};

	const mockChat = createChat({
		id: "chat-1",
		user1Id: "user-1",
		user2Id: "mentor-1",
	});
	const mockUsers = [
		createUser({ id: "user-1", name: "User One" }),
		createUser({ id: "mentor-1", name: "Mentor One" }),
	];

	beforeEach(() => {
		chatRepository = createMock<IChatRepository>();
		chatMessageRepository = createMock<IChatMessageRepository>();
		idGenerator = createMock<IIdGenerator>();
		createChatUseCase = createMock<ICreateChatUseCase>();
		eventBus = createMock<EventBus>();

		useCase = new SendMessageUseCase(
			chatRepository,
			chatMessageRepository,
			idGenerator,
			createChatUseCase,
			eventBus,
		);

		idGenerator.generate.mockReturnValue("message-id-123");
		chatRepository.findById.mockResolvedValue(mockChat);
		chatMessageRepository.create.mockResolvedValue(
			createChatMessage({
				id: "message-id-123",
				chatId: "chat-1",
				senderId: "user-1",
				content: "Hello mentor!",
			}),
		);
		chatRepository.findByParticipantsWithUsers.mockResolvedValue({
			chat: mockChat,
			users: mockUsers,
		});
		chatRepository.updateById.mockResolvedValue(mockChat);
	});

	it("should throw InvalidMessageError when both content and mediaId are missing", async () => {
		const input: SendMessageInput = {
			chatId: "chat-1",
			senderId: "user-1",
			content: null,
			mediaId: null,
		};

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			InvalidMessageError,
		);
		expect(chatMessageRepository.create).not.toHaveBeenCalled();
	});

	it("should throw ChatNotFoundError when chat does not exist and create fails", async () => {
		chatRepository.findById.mockResolvedValue(null);
		chatRepository.findByParticipants.mockResolvedValue(null);
		createChatUseCase.execute.mockRejectedValue(new ChatNotFoundError());

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ChatNotFoundError,
		);
	});

	it("should throw ChatAccessDeniedError when sender is not a participant", async () => {
		const otherUserChat = createChat({
			id: "chat-1",
			user1Id: "other-1",
			user2Id: "other-2",
		});
		chatRepository.findById.mockResolvedValue(otherUserChat);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ChatAccessDeniedError,
		);
		expect(chatMessageRepository.create).not.toHaveBeenCalled();
	});

	it("should create message with TEXT type when only content provided", async () => {
		chatRepository.findById.mockResolvedValue(mockChat);

		const result = await useCase.execute(baseInput);

		expect(chatMessageRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				messageType: "TEXT",
				content: "Hello mentor!",
				attachementId: null,
			}),
		);
		expect(result.message.content).toBe("Hello mentor!");
	});

	it("should create message with FILE/IMAGE type when mediaId provided", async () => {
		const input: SendMessageInput = {
			...baseInput,
			mediaId: "media-123",
			messageType: "IMAGE",
		};
		chatRepository.findById.mockResolvedValue(mockChat);
		chatMessageRepository.create.mockResolvedValue(
			createChatMessage({
				id: "message-id-123",
				chatId: "chat-1",
				senderId: "user-1",
				content: "Hello mentor!",
				messageType: "IMAGE",
				attachementId: "media-123",
			}),
		);

		const result = await useCase.execute(input);

		expect(chatMessageRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				messageType: "IMAGE",
				content: "Hello mentor!",
				attachementId: "media-123",
			}),
		);
		expect(result.message.attachementId).toBe("media-123");
	});

	it("should use existing chat when found by ID", async () => {
		chatRepository.findById.mockResolvedValue(mockChat);

		await useCase.execute(baseInput);

		expect(chatRepository.findById).toHaveBeenCalledWith("chat-1");
		expect(createChatUseCase.execute).not.toHaveBeenCalled();
	});

	it("should find existing chat by participants when not found by ID", async () => {
		chatRepository.findById.mockResolvedValue(null);
		chatRepository.findByParticipants.mockResolvedValue(mockChat);

		await useCase.execute(baseInput);

		expect(chatRepository.findByParticipants).toHaveBeenCalledWith(
			"user-1",
			"chat-1",
		);
		expect(createChatUseCase.execute).not.toHaveBeenCalled();
	});

	const mockChatDto: ChatDto = {
		id: "chat-1",
		senderId: "user-1",
		receiverId: "mentor-1",
		sender: { id: "user-1", name: "User One" },
		receiver: { id: "mentor-1", name: "Mentor One" },
		lastMessageId: null,
		lastMessage: null,
		unreadCount: { "user-1": 0, "mentor-1": 0 },
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	it("should create new chat when none exists between participants", async () => {
		chatRepository.findById.mockResolvedValue(null);
		chatRepository.findByParticipants.mockResolvedValue(null);
		createChatUseCase.execute.mockResolvedValue({ chat: mockChatDto });
		chatRepository.findById
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(mockChat);

		await useCase.execute(baseInput);

		expect(createChatUseCase.execute).toHaveBeenCalledWith({
			userId: "user-1",
			otherUserId: "chat-1",
		});
	});

	it("should increment unread count for receiver", async () => {
		chatRepository.findById.mockResolvedValue(mockChat);

		await useCase.execute(baseInput);

		expect(chatRepository.updateById).toHaveBeenCalledWith(
			"chat-1",
			expect.objectContaining({
				unreadCount: expect.any(Map),
			}),
		);
	});

	it("should publish MessageSentEvent", async () => {
		chatRepository.findById.mockResolvedValue(mockChat);

		await useCase.execute(baseInput);

		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					chatId: "chat-1",
					receiverId: "mentor-1",
					senderName: "User One",
					receiverName: "Mentor One",
				}),
			}),
		);
	});

	it("should include repliedTo when provided", async () => {
		const input: SendMessageInput = {
			...baseInput,
			repliedTo: "reply-message-id",
		};
		chatRepository.findById.mockResolvedValue(mockChat);

		await useCase.execute(input);

		expect(chatMessageRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({ repliedTo: "reply-message-id" }),
		);
	});
});
