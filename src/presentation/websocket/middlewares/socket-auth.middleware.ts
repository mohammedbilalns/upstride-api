import type { Socket } from "socket.io";
import type { ITokenService } from "../../../application/services";
import type { ITokenRevocationRepository } from "../../../domain/repositories/token-revocation.repository.interface";
import logger from "../../../shared/logging/logger";

export type AuthedSocket = Socket & {
	data: {
		user: {
			id: string;
			role: string;
			sid: string;
		};
	};
};

/**
 * Creates a Socket.io middleware function that authenticates incoming WebSocket connections.
 * Extracts and verifies JWT token from handshake, checks token revocation status,
 * and attaches user info to the socket for use in subsequent handlers.
 */
export const createSocketAuthMiddleware = (
	tokenService: ITokenService,
	tokenRevocationRepository: ITokenRevocationRepository,
) => {
	return async (socket: Socket, next: (err?: Error) => void) => {
		try {
			const token =
				socket.handshake.auth.token ||
				socket.handshake.headers.authorization?.split(" ")[1];

			if (!token) {
				return next(new Error("Authentication error: Token missing"));
			}

			const payload = await tokenService.verifyAccessToken(token);
			const isRevoked = await tokenRevocationRepository.isSessionRevoked(
				payload.sid,
			);

			if (isRevoked) {
				return next(new Error("Authentication error: Session revoked"));
			}

			const authedSocket = socket as AuthedSocket;
			authedSocket.data.user = {
				id: payload.sub,
				role: payload.role,
				sid: payload.sid,
			};

			next();
		} catch (error) {
			logger.error(`WebSocket Auth Error: ${error}`);
			next(new Error("Authentication error: Invalid token"));
		}
	};
};
