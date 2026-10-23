import { inject, injectable } from "inversify";
import type {
	IGetChatsUseCase,
	IGetChatUseCase,
	IMarkMessagesReadUseCase,
	ISendMessageUseCase,
} from "../../../application/modules/chat/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	ChatIdParams,
	ChatQuery,
	GetChatParams,
	GetChatQuery,
	SendMessageBody,
} from "../validators";

@injectable()
export class ChatController {
	constructor(
		@inject(TYPES.UseCases.GetChats)
		private readonly _getChatsUseCase: IGetChatsUseCase,
		@inject(TYPES.UseCases.GetChat)
		private readonly _getChatUseCase: IGetChatUseCase,
		@inject(TYPES.UseCases.SendChatMessage)
		private readonly _sendMessageUseCase: ISendMessageUseCase,
		@inject(TYPES.UseCases.MarkChatMessagesRead)
		private readonly _markMessagesReadUseCase: IMarkMessagesReadUseCase,
	) {}

	getChats = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._getChatsUseCase.execute({
			userId: req.user.id,
			...(req.validated.query as ChatQuery),
		});

		return sendSuccess(res, HttpStatus.OK, { data: result });
	});

	getChat = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._getChatUseCase.execute({
			userId: req.user.id,
			...(req.validated.params as GetChatParams),
			...(req.validated.query as GetChatQuery),
		});

		return sendSuccess(res, HttpStatus.OK, { data: result });
	});

	sendMessage = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._sendMessageUseCase.execute({
			...(req.validated.params as ChatIdParams),
			...(req.validated.body as SendMessageBody),
			senderId: req.user.id,
		});

		return sendSuccess(res, HttpStatus.CREATED, { data: result });
	});

	markRead = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._markMessagesReadUseCase.execute({
			...(req.validated.params as ChatIdParams),
			readerId: req.user.id,
		});

		return sendSuccess(res, HttpStatus.OK, { data: result });
	});
}
