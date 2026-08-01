import { inject, injectable } from "inversify";
import { Chat } from "../../../../domain/entities/chat.entity";
import type {
	IChatMessageRepository,
	IChatRepository,
	IUserRepository,
} from "../../../../domain/repositories";
import { TYPES } from "../../../../shared/types/types";
import type { IStorageService } from "../../../services/storage.service.interface";
import type {
	ChatUserDto,
	GetChatInput,
	GetChatOutput,
} from "../dtos/chat.dto";
import { ChatNotFoundError } from "../errors";
import { ChatMapper } from "../mappers/chat.mapper";
import { ChatMessageMapper } from "../mappers/chat-message.mapper";
import type { IGetChatUseCase } from "./get-chat.use-case.interface";

const CHAT_MESSAGES_PAGE_SIZE = 10;

@injectable()
export class GetChatUseCase implements IGetChatUseCase {
	constructor(
		@inject(TYPES.Repositories.ChatRepository)
		private readonly _chatRepository: IChatRepository,
		@inject(TYPES.Repositories.ChatMessageRepository)
		private readonly _chatMessageRepository: IChatMessageRepository,
		@inject(TYPES.Repositories.UserRepository)
		private readonly _userRepository: IUserRepository,
		@inject(TYPES.Services.Storage)
		private readonly _storageService: IStorageService,
	) {}

	async execute(input: GetChatInput): Promise<GetChatOutput> {
		const { chat: existing, users } =
			await this._chatRepository.findByParticipantsWithUsers(
				input.userId,
				input.otherUserId,
			);

		if (!existing) {
			throw new ChatNotFoundError();
		}

		const usersByIdRaw = new Map(users.map((user) => [user.id, user]));
		const usersById = new Map<string, ChatUserDto>();

		let receiverDto: ChatUserDto | null = null;
		const receiverUser = usersByIdRaw.get(input.otherUserId);

		if (receiverUser) {
			const profilePictureUrl = receiverUser.profilePictureId
				? this._storageService.getPublicUrl(receiverUser.profilePictureId)
				: null;
			receiverDto = {
				id: receiverUser.id,
				name: receiverUser.name,
				profilePictureUrl,
				role: receiverUser.role ?? "USER",
			};
			usersById.set(receiverUser.id, receiverDto);
		} else {
			const user = await this._userRepository.findById(input.otherUserId);
			if (user) {
				const profilePictureUrl = user.profilePictureId
					? this._storageService.getPublicUrl(user.profilePictureId)
					: null;
				receiverDto = {
					id: user.id,
					name: user.name,
					profilePictureUrl,
					role: user.role ?? "USER",
				};
				usersById.set(user.id, receiverDto);
			}
		}

		const senderUser = usersByIdRaw.get(input.userId);
		if (senderUser) {
			usersById.set(senderUser.id, {
				id: senderUser.id,
				name: senderUser.name,
				profilePictureUrl: null,
				role: senderUser.role ?? "USER",
			});
		} else {
			const user = await this._userRepository.findById(input.userId);
			if (user) {
				usersById.set(user.id, {
					id: user.id,
					name: user.name,
					profilePictureUrl: null,
					role: user.role ?? "USER",
				});
			}
		}

		const result = await this._chatMessageRepository.listByChatId(
			existing.id,
			input.cursor ?? null,
			CHAT_MESSAGES_PAGE_SIZE,
		);

		const updatedCount = await this._chatMessageRepository.markAsRead(
			existing.id,
			input.userId,
		);

		const unreadCount = new Map(existing.unreadCount);
		unreadCount.set(input.userId, 0);
		await this._chatRepository.updateById(existing.id, { unreadCount });

		const chatForResponse =
			updatedCount > 0 || unreadCount.get(input.userId) === 0
				? new Chat(
						existing.id,
						existing.user1Id,
						existing.user2Id,
						existing.lastMessageId,
						unreadCount,
						existing.createdAt,
						existing.updatedAt,
					)
				: existing;

		const mediaUrls = new Map<string, string>();
		await Promise.all(
			result.items.map(async (item) => {
				if (!item.attachementId) return;
				if (mediaUrls.has(item.attachementId)) return;
				const url = await this._storageService.getSignedUrl(item.attachementId);
				mediaUrls.set(item.attachementId, url);
			}),
		);

		return {
			chat: ChatMapper.toDtoForUser(chatForResponse, input.userId, usersById),
			receiver: receiverDto,
			messages: result.items.map((item) =>
				ChatMessageMapper.toDto(
					item,
					item.attachementId
						? (mediaUrls.get(item.attachementId) ?? null)
						: null,
				),
			),
			limit: result.limit,
			nextCursor: result.nextCursor,
			hasMore: result.hasMore,
		};
	}
}
