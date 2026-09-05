import { MongooseError } from "mongoose";
import type { Socket } from "socket.io";
import { ZodError } from "zod";
import { ErrorMessages, HttpStatus } from "../../../shared/constants";
import { BaseError } from "../../../shared/errors/base.error";
import logger from "../../../shared/logging/logger";

type SocketHandler = (
	payload: unknown,
	...args: unknown[]
) => Promise<void> | void;

/**
 * A wrapper for Socket.io event handlers that catches async errors and
 */
export const socketAsyncHandler = (
	handler: SocketHandler,
	errorEvent = "socket:error",
) => {
	return async function (this: Socket, payload: unknown, ...args: unknown[]) {
		try {
			await handler.apply(this, [payload, ...args]);
		} catch (err) {
			const socket = this as Socket;

			// Application / Domain Errors
			if (err instanceof BaseError) {
				logger.error(`[SocketError][${err.name}] ${err.message}`);
				socket.emit(errorEvent, {
					success: false,
					message: err.message,
				});
				return;
			}

			if (err instanceof ZodError) {
				const errors = err.issues.map((e) => ({
					path: e.path.join("."),
					message: e.message,
				}));

				socket.emit(errorEvent, {
					success: false,
					message: errors[0].message,
				});
				return;
			}

			// Mongo Errors
			if (err instanceof MongooseError) {
				logger.error(`[SocketMongoError] ${err.message}`);
				socket.emit(errorEvent, {
					success: false,
					message: ErrorMessages.INTERNAL_SERVER_ERROR,
					statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
				});
				return;
			}

			// Unexpected Runtime Errors
			if (err instanceof Error) {
				logger.error(`[SocketUnhandledError] ${err.stack}`);
				socket.emit(errorEvent, {
					success: false,
					message: ErrorMessages.INTERNAL_SERVER_ERROR,
				});
				return;
			}

			// Unknown Errors
			logger.error(`[SocketUnknownError] ${String(err)}`);
			socket.emit(errorEvent, {
				success: false,
				message: ErrorMessages.INTERNAL_SERVER_ERROR,
			});
		}
	};
};
