import { inject, injectable } from "inversify";
import type { ICheckAndCreateAvailabilityUseCase } from "../../../application/modules/availability/use-cases/check-and-create-availability.use-case.interface";
import type { ICheckAndReenableAvailabilityUseCase } from "../../../application/modules/availability/use-cases/check-and-reenable-availability.use-case.interface";
import type { ICheckAndUpdateAvailabilityUseCase } from "../../../application/modules/availability/use-cases/check-and-update-availability.use-case.interface";
import type { ICreateAvailabilityUseCase } from "../../../application/modules/availability/use-cases/create-availability.use-case.interface";
import type { IDeleteAvailabilityUseCase } from "../../../application/modules/availability/use-cases/delete-availability.use-case.interface";
import type { IGetMentorAvailabilitiesUseCase } from "../../../application/modules/availability/use-cases/get-mentor-availabilities.use-case.interface";
import type { IReenableAvailabilityUseCase } from "../../../application/modules/availability/use-cases/reenable-availability.use-case.interface";
import type { IUpdateAvailabilityUseCase } from "../../../application/modules/availability/use-cases/update-availability.use-case.interface";
import { HttpStatus } from "../../../shared/constants/http-status-codes";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { RESPONSE_MESSAGES } from "../constants/response-messages";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	AvailabilityIdParam,
	CreateAvailabilityBody,
	GetMentorAvailabilitiesQuery,
	UpdateAvailabilityParams,
	UpdateAvailabiltyBody,
} from "../validators";

@injectable()
export class AvailabilityController {
	constructor(
		@inject(TYPES.UseCases.CreateAvailability)
		private readonly _createAvailabilityUseCase: ICreateAvailabilityUseCase,
		@inject(TYPES.UseCases.CheckAndCreateAvailability)
		private readonly _checkAndCreateAvailabilityUseCase: ICheckAndCreateAvailabilityUseCase,
		@inject(TYPES.UseCases.CheckAndReenableAvailability)
		private readonly _checkAndReenableAvailabilityUseCase: ICheckAndReenableAvailabilityUseCase,
		@inject(TYPES.UseCases.UpdateAvailability)
		private readonly _updateAvailabilityUseCase: IUpdateAvailabilityUseCase,
		@inject(TYPES.UseCases.DeleteAvailability)
		private readonly _deleteAvailabilityUseCase: IDeleteAvailabilityUseCase,
		@inject(TYPES.UseCases.GetMentorAvailabilities)
		private readonly _getMentorAvailabilitiesUseCase: IGetMentorAvailabilitiesUseCase,
		@inject(TYPES.UseCases.ReenableAvailability)
		private readonly _reenableAvailabilityUseCase: IReenableAvailabilityUseCase,
		@inject(TYPES.UseCases.CheckAndUpdateAvailability)
		private readonly _checkAndUpdateAvailabilityUseCase: ICheckAndUpdateAvailabilityUseCase,
	) {}

	createAvailability = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._createAvailabilityUseCase.execute({
			userId: req.user.id,
			...(req.validated.body as CreateAvailabilityBody),
		});

		return sendSuccess(res, HttpStatus.CREATED, {
			message: RESPONSE_MESSAGES.AVAILABILITY.CREATED,
			data: result.availabilityId,
		});
	});

	checkAndCreateAvailability = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const result = await this._checkAndCreateAvailabilityUseCase.execute({
				userId: req.user.id,
				...(req.validated.body as CreateAvailabilityBody),
			});

			if (result.created) {
				return sendSuccess(res, HttpStatus.CREATED, {
					message: RESPONSE_MESSAGES.AVAILABILITY.CREATED,
					data: result,
				});
			}

			return sendSuccess(res, HttpStatus.OK, {
				message: RESPONSE_MESSAGES.AVAILABILITY.CONFLICT,
				data: result,
			});
		},
	);

	updateAvailability = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._updateAvailabilityUseCase.execute({
			availabilityId: (req.validated.params as UpdateAvailabilityParams).id,
			userId: req.user.id,
			...(req.validated.body as UpdateAvailabiltyBody),
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: RESPONSE_MESSAGES.AVAILABILITY.UPDATED,
			data: result.availabilityId,
		});
	});

	checkAndUpdateAvailability = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const result = await this._checkAndUpdateAvailabilityUseCase.execute({
				availabilityId: (req.validated.params as UpdateAvailabilityParams).id,
				userId: req.user.id,
				...(req.validated.body as UpdateAvailabiltyBody),
			});

			if (result.updated) {
				return sendSuccess(res, HttpStatus.OK, {
					message: RESPONSE_MESSAGES.AVAILABILITY.UPDATED,
					data: result,
				});
			}

			return sendSuccess(res, HttpStatus.OK, {
				message: RESPONSE_MESSAGES.AVAILABILITY.CONFLICT,
				data: result,
			});
		},
	);

	deleteAvailability = asyncHandler(async (req: AuthenticatedRequest, res) => {
		await this._deleteAvailabilityUseCase.execute({
			availabilityId: (req.validated.params as AvailabilityIdParam).id,
			userId: req.user.id,
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: RESPONSE_MESSAGES.AVAILABILITY.DELETED,
		});
	});

	reenableAvailability = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			await this._reenableAvailabilityUseCase.execute({
				availabilityId: (req.validated.params as AvailabilityIdParam).id,
				userId: req.user.id,
			});

			return sendSuccess(res, HttpStatus.OK, {
				message: RESPONSE_MESSAGES.AVAILABILITY.UPDATED,
			});
		},
	);

	checkAndReenableAvailability = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const result = await this._checkAndReenableAvailabilityUseCase.execute({
				availabilityId: (req.validated.params as AvailabilityIdParam).id,
				userId: req.user.id,
			});

			if (result.enabled) {
				return sendSuccess(res, HttpStatus.OK, {
					message: RESPONSE_MESSAGES.AVAILABILITY.UPDATED,
					data: result,
				});
			}

			return sendSuccess(res, HttpStatus.OK, {
				message: RESPONSE_MESSAGES.AVAILABILITY.CONFLICT,
				data: result,
			});
		},
	);

	getMentorAvailabilities = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const result = await this._getMentorAvailabilitiesUseCase.execute({
				userId: req.user.id,
				...(req.validated.query as GetMentorAvailabilitiesQuery),
			});

			return sendSuccess(res, HttpStatus.OK, {
				message: RESPONSE_MESSAGES.AVAILABILITY.RETRIEVED,
				data: result,
			});
		},
	);
}
