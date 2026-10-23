import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../../../application/modules/authentication/errors";
import type { ITokenService } from "../../../application/services";
import type { ITokenRevocationRepository } from "../../../domain/repositories/token-revocation.repository.interface";
import { apiContainer } from "../../../main/di/api.container";
import logger from "../../../shared/logging/logger";
import { TYPES } from "../../../shared/types/types";

export const verifySession = async (
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			throw new UnauthorizedError();
		}

		const token = authHeader.split(" ")[1];

		const tokenService = apiContainer.get<ITokenService>(
			TYPES.Services.TokenService,
		);
		const tokenRevocationRepository =
			apiContainer.get<ITokenRevocationRepository>(
				TYPES.Repositories.TokenRevocationRepository,
			);

		const payload = await tokenService.verifyAccessToken(token);

		const isRevoked = await tokenRevocationRepository.isSessionRevoked(
			payload.sid,
		);

		if (isRevoked) {
			throw new UnauthorizedError();
		}

		req.user = {
			id: payload.sub,
			role: payload.role,
			sid: payload.sid,
		};
		next();
	} catch (error) {
		logger.error(`Failed to validate session: ${error}`);
		next(error instanceof UnauthorizedError ? error : new UnauthorizedError());
	}
};
