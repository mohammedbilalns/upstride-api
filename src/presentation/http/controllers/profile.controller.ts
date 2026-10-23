import { inject, injectable } from "inversify";
import type {
	IGetMeUseCase,
	IVerifyChangePasswordOtpUseCase,
} from "../../../application/modules/authentication/use-cases";
import type {
	IChangePasswordUseCase,
	IGetProfileUseCase,
	IRequestChangePasswordUseCase,
	IUpdateProfileUseCase,
} from "../../../application/modules/profile/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { AuthResponseMessages, ProfileResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	ChangePasswordBody,
	RequestChangePasswordBody,
	UpdateProfileBody,
	VerifyProfileOtpBody,
} from "../validators";

@injectable()
export class ProfileController {
	constructor(
		@inject(TYPES.UseCases.GetProfile)
		private readonly _getProfileUseCase: IGetProfileUseCase,
		@inject(TYPES.UseCases.UpdateProfile)
		private readonly _updateProfileUseCase: IUpdateProfileUseCase,
		@inject(TYPES.UseCases.ChangePassword)
		private readonly _changePasswordUseCase: IChangePasswordUseCase,
		@inject(TYPES.UseCases.GetMe)
		private readonly _getMeUseCase: IGetMeUseCase,
		@inject(TYPES.UseCases.RequestChangePassword)
		private readonly _requestChangePasswordUseCase: IRequestChangePasswordUseCase,
		@inject(TYPES.UseCases.VerifyChangePasswordOtp)
		private readonly _verifyChangePasswordOtpUseCase: IVerifyChangePasswordOtpUseCase,
	) {}

	getMe = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const userId = req.user.id;
		const data = await this._getMeUseCase.execute({ userId });

		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.FETCH_USER_SUCCESS,
			data,
		});
	});

	getProfile = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const userId = req.user.id;
		const result = await this._getProfileUseCase.execute({ userId });

		return sendSuccess(res, HttpStatus.OK, {
			message: ProfileResponseMessages.FETCH_PROFILE_SUCCESS,
			data: result,
		});
	});

	updateProfile = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const userId = req.user.id;
		const result = await this._updateProfileUseCase.execute({
			...(req.validated.body as UpdateProfileBody),
			userId,
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: ProfileResponseMessages.UPDATE_PROFILE_SUCCESS,
			data: result,
		});
	});

	requestChangePassword = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const userId = req.user.id;

			await this._requestChangePasswordUseCase.execute({
				...(req.validated.body as RequestChangePasswordBody),
				userId,
			});

			return sendSuccess(res, HttpStatus.OK, {
				message: AuthResponseMessages.OTP_SENT,
			});
		},
	);

	verifyChangePasswordOtp = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const userId = req.user.id;

			const result = await this._verifyChangePasswordOtpUseCase.execute({
				userId,
				...(req.validated.body as VerifyProfileOtpBody),
			});

			return sendSuccess(res, HttpStatus.OK, {
				message: AuthResponseMessages.OTP_VERIFIED,
				data: result,
			});
		},
	);

	changePassword = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const userId = req.user.id;

		await this._changePasswordUseCase.execute({
			...(req.validated.body as ChangePasswordBody),
			userId,
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: ProfileResponseMessages.CHANGE_PASSWORD_SUCCESS,
		});
	});
}
