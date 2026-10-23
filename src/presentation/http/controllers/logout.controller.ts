import { inject, injectable } from "inversify";
import type {
	IGetActiveSessionsUseCase,
	ILogoutUseCase,
	IRevokeAllOtherSessionsUseCase,
	IRevokeSessionUseCase,
} from "../../../application/modules/authentication/use-cases";
import env from "../../../shared/config/env";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { AuthResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type { RevokeSessionBody } from "../validators/auth";

@injectable()
export class LogoutController {
	constructor(
		@inject(TYPES.UseCases.Logout)
		private _logoutUseCase: ILogoutUseCase,
		@inject(TYPES.UseCases.RevokeSession)
		private _revokeSessionUseCase: IRevokeSessionUseCase,
		@inject(TYPES.UseCases.RevokeAllOtherSessions)
		private _revokeAllOtherSessionsUseCase: IRevokeAllOtherSessionsUseCase,
		@inject(TYPES.UseCases.GetActiveSessions)
		private _getActiveSessionsUseCase: IGetActiveSessionsUseCase,
	) {}

	logout = asyncHandler(async (req: AuthenticatedRequest, res) => {
		await this._logoutUseCase.execute({
			sessionId: req.user.sid,
		});

		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
			path: "/",
		});

		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.LOGOUT_SUCCESS,
		});
	});

	revokeSession = asyncHandler(async (req: AuthenticatedRequest, res) => {
		await this._revokeSessionUseCase.execute({
			requesterUserId: req.user.id,
			...(req.validated.body as RevokeSessionBody),
		});

		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.SESSION_REVOKED,
		});
	});

	revokeAllOtherSessions = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const { id: requesterUserId, sid: requesterSessionId } = req.user;

			await this._revokeAllOtherSessionsUseCase.execute({
				requesterUserId,
				requesterSessionId,
			});

			sendSuccess(res, HttpStatus.OK, {
				message: AuthResponseMessages.ALL_OTHER_SESSIONS_REVOKED,
			});
		},
	);

	getActiveSessions = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const { id: userId, sid: currentSessionId } = req.user;

		const data = await this._getActiveSessionsUseCase.execute(
			{ userId },
			currentSessionId,
		);

		sendSuccess(res, HttpStatus.OK, {
			message: AuthResponseMessages.FETCH_SESSIONS_SUCCESS,
			data,
		});
	});
}
