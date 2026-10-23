import { inject, injectable } from "inversify";
import type {
	IGetNotificationsUseCase,
	IGetUnreadNotificationCountUseCase,
	IMarkAllNotificationsReadUseCase,
	IMarkNotificationReadUseCase,
	IRegisterPushSubscriptionUseCase,
	IUnregisterPushSubscriptionUseCase,
} from "../../../application/modules/notification/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	NotificationIdParam,
	NotificationsQuery,
	RegisterPushSubscriptionBody,
} from "../validators";

@injectable()
export class NotificationController {
	constructor(
		@inject(TYPES.UseCases.GetNotifications)
		private readonly _getNotificationsUseCase: IGetNotificationsUseCase,
		@inject(TYPES.UseCases.MarkNotificationRead)
		private readonly _markNotificationReadUseCase: IMarkNotificationReadUseCase,
		@inject(TYPES.UseCases.MarkAllNotificationsRead)
		private readonly _markAllNotificationsReadUseCase: IMarkAllNotificationsReadUseCase,
		@inject(TYPES.UseCases.GetUnreadNotificationCount)
		private readonly _getUnreadNotificationCountUseCase: IGetUnreadNotificationCountUseCase,
		@inject(TYPES.UseCases.RegisterPushSubscription)
		private readonly _registerPushSubscriptionUseCase: IRegisterPushSubscriptionUseCase,
		@inject(TYPES.UseCases.UnregisterPushSubscription)
		private readonly _unregisterPushSubscriptionUseCase: IUnregisterPushSubscriptionUseCase,
	) {}

	registerPushSubscription = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			await this._registerPushSubscriptionUseCase.execute({
				userId: req.user.id,
				...(req.validated.body as RegisterPushSubscriptionBody),
			});

			return sendSuccess(res, HttpStatus.OK, {
				message: "Push subscription registered successfully",
			});
		},
	);

	unregisterPushSubscription = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			await this._unregisterPushSubscriptionUseCase.execute({
				userId: req.user.id,
				...(req.validated.body as RegisterPushSubscriptionBody),
			});

			return sendSuccess(res, HttpStatus.OK, {
				message: "Push subscription unregistered successfully",
			});
		},
	);

	getNotifications = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._getNotificationsUseCase.execute({
			userId: req.user.id,
			...(req.validated.query as NotificationsQuery),
		});

		return sendSuccess(res, HttpStatus.OK, { data: result });
	});

	markRead = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._markNotificationReadUseCase.execute({
			userId: req.user.id,
			...(req.validated.params as NotificationIdParam),
		});

		return sendSuccess(res, HttpStatus.OK, { data: result });
	});

	markAllRead = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._markAllNotificationsReadUseCase.execute({
			userId: req.user.id,
		});

		return sendSuccess(res, HttpStatus.OK, { data: result });
	});

	getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._getUnreadNotificationCountUseCase.execute({
			userId: req.user.id,
		});

		return sendSuccess(res, HttpStatus.OK, { data: result });
	});
}
