import type { Response } from "express";
import { inject, injectable } from "inversify";
import type {
	ILoginWithEmailUseCase,
	IRefreshSessionUseCase,
	IRegisterWithEmailUseCase,
	IResendRegistrationOtpUseCase,
	ISaveUserInterestsUseCase,
	ISocialLoginUseCase,
	IVerifyRegistrationOtpUseCase,
} from "../../../application/modules/authentication/use-cases";
import type { IDummyLoginUseCase } from "../../../application/modules/authentication/use-cases/login/dummy-login.use-case.interface";
import env from "../../../shared/config/env";
import { HttpStatus } from "../../../shared/constants";
import { TYPES } from "../../../shared/types/types";
import { extractDeviceInfo } from "../../../shared/utilities/extract-device-info.util";
import { AuthResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import { generateCsrfToken } from "../middlewares/csrf.middleware";
import type {
	GoogleLoginBody,
	LinkedInLoginBody,
	LoginBody,
	RegisterBody,
	ResendOtpBody,
	SaveInterestsBody,
	VerifyOtpBody,
} from "../validators/auth";

@injectable()
export class AuthController {
	constructor(
		@inject(TYPES.UseCases.LoginWithEmail)
		private _loginWithEmailUseCase: ILoginWithEmailUseCase,
		@inject(TYPES.UseCases.SocialLogin)
		private _socialLoginUseCase: ISocialLoginUseCase,
		@inject(TYPES.UseCases.RegisterWithEmail)
		private _registerWithEmailUseCase: IRegisterWithEmailUseCase,
		@inject(TYPES.UseCases.VerifyRegistrationOtp)
		private _verifyRegistrationOtpUseCase: IVerifyRegistrationOtpUseCase,
		@inject(TYPES.UseCases.ResendRegistrationOtp)
		private _resendRegistrationOtpUseCase: IResendRegistrationOtpUseCase,
		@inject(TYPES.UseCases.RefreshSession)
		private _refreshSessionUseCase: IRefreshSessionUseCase,
		@inject(TYPES.UseCases.SaveUserInterests)
		private _saveUserInterestsUseCase: ISaveUserInterestsUseCase,
		@inject(TYPES.UseCases.DummyLogin)
		private _dummyLoginUseCase: IDummyLoginUseCase,
	) {}

	register = asyncHandler(async (req, res) => {
		await this._registerWithEmailUseCase.execute(
			req.validated?.body as RegisterBody,
		);

		sendSuccess(res, HttpStatus.CREATED, {
			message: AuthResponseMessages.REGISTER_SUCCESS,
		});
	});

	verifyRegisterOtp = asyncHandler(async (req, res) => {
		const data = await this._verifyRegistrationOtpUseCase.execute({
			...(req.validated?.body as VerifyOtpBody),
		});

		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.OTP_VERIFIED,
			data,
		});
	});

	resendRegisterOtp = asyncHandler(async (req, res) => {
		await this._resendRegistrationOtpUseCase.execute({
			...(req.validated?.body as ResendOtpBody),
		});

		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.OTP_RESENT,
		});
	});

	login = asyncHandler(async (req, res) => {
		const deviceInfo = extractDeviceInfo(req);

		const { refreshToken, ...data } = await this._loginWithEmailUseCase.execute(
			{
				...(req.validated?.body as LoginBody),
				...deviceInfo,
			},
		);

		this._setRefreshTokenCookie(res, refreshToken);
		req.cookies.refreshToken = refreshToken;
		const csrfToken = generateCsrfToken(req, res);
		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.LOGIN_SUCCESS,
			data: { ...data, csrfToken },
		});
	});

	dummyLogin = asyncHandler(async (req, res) => {
		const { refreshToken, ...data } = await this._dummyLoginUseCase.execute();

		this._setRefreshTokenCookie(res, refreshToken);
		req.cookies.refreshToken = refreshToken;
		const csrfToken = generateCsrfToken(req, res);
		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.LOGIN_SUCCESS,
			data: { ...data, csrfToken },
		});
	});

	loginWithGoogle = asyncHandler(async (req, res) => {
		const deviceInfo = extractDeviceInfo(req);
		const data = await this._socialLoginUseCase.execute({
			provider: "GOOGLE",
			credential: (req.validated?.body as GoogleLoginBody).code,
			...deviceInfo,
		});

		let csrfToken: string | undefined;
		if ("refreshToken" in data) {
			this._setRefreshTokenCookie(res, data.refreshToken);
			req.cookies.refreshToken = data.refreshToken;
			csrfToken = generateCsrfToken(req, res);
		}
		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.LOGIN_SUCCESS,
			data:
				"refreshToken" in data
					? { ...(({ refreshToken, ...rest }) => rest)(data), csrfToken }
					: data,
		});
	});

	loginWithLinkedIn = asyncHandler(async (req, res) => {
		const deviceInfo = extractDeviceInfo(req);
		const body = req.validated?.body as LinkedInLoginBody;

		const data = await this._socialLoginUseCase.execute({
			provider: "LINKEDIN",
			credential: `${body.code}::${body.redirectUri}`,
			...deviceInfo,
		});

		let csrfToken: string | undefined;
		if ("refreshToken" in data) {
			this._setRefreshTokenCookie(res, data.refreshToken);
			req.cookies.refreshToken = data.refreshToken;
			csrfToken = generateCsrfToken(req, res);
		}
		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.LOGIN_SUCCESS,
			data:
				"refreshToken" in data
					? { ...(({ refreshToken, ...rest }) => rest)(data), csrfToken }
					: data,
		});
	});

	saveInterests = asyncHandler(async (req, res) => {
		const deviceInfo = extractDeviceInfo(req);

		const { refreshToken, ...data } =
			await this._saveUserInterestsUseCase.execute({
				...(req.validated?.body as SaveInterestsBody),
				...deviceInfo,
			});

		this._setRefreshTokenCookie(res, refreshToken);
		req.cookies.refreshToken = refreshToken;
		const csrfToken = generateCsrfToken(req, res);
		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.LOGIN_SUCCESS,
			data: { ...data, csrfToken },
		});
	});

	refreshSession = asyncHandler(async (req, res) => {
		const refreshToken = req.cookies.refreshToken;
		const { refreshToken: newRefreshToken, ...data } =
			await this._refreshSessionUseCase.execute({ refreshToken });

		this._setRefreshTokenCookie(res, newRefreshToken);
		req.cookies.refreshToken = newRefreshToken;

		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.REFRESH_SESSION_SUCCESS,
			data,
		});
	});

	getCsrfToken = asyncHandler(async (req, res) => {
		const csrfToken = generateCsrfToken(req, res);
		sendSuccess(res, HttpStatus.OK, {
			data: { csrfToken },
		});
	});

	private _setRefreshTokenCookie(res: Response, token: string) {
		res.cookie("refreshToken", token, {
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
			path: "/",
		});
	}
}
