import type { Server as HTTPServer } from "node:http";
import { createShardedAdapter } from "@socket.io/redis-adapter";
import { inject, injectable } from "inversify";
import type { Redis } from "ioredis";
import { Server as SocketIOServer } from "socket.io";
import type { ITokenService } from "../../application/services";
import type { ITokenRevocationRepository } from "../../domain/repositories/token-revocation.repository.interface";
import { redisClient } from "../../infrastructure/database/redis/redis.connection";
import logger from "../../shared/logging/logger";
import { TYPES } from "../../shared/types/types";
import { socketIOCorsOptions } from "./config/cors.config";
import type { CallHandler } from "./handlers/call.handler";
import {
	type AuthedSocket,
	createSocketAuthMiddleware,
} from "./middlewares/socket-auth.middleware";

@injectable()
export class WebSocketServer {
	private _io: SocketIOServer | null = null;
	private _redisSubClient: Redis | null = null;

	constructor(
		@inject(TYPES.WebSockets.CallHandler)
		private readonly _callHandler: CallHandler,
		@inject(TYPES.Services.TokenService)
		private readonly _tokenService: ITokenService,
		@inject(TYPES.Repositories.TokenRevocationRepository)
		private readonly _tokenRevocationRepository: ITokenRevocationRepository,
	) {}

	/**
	 * Initializes the Socket.io server and attaches it to the HTTP server.
	 */
	public initialize(httpServer: HTTPServer): void {
		this._io = new SocketIOServer(httpServer, {
			cors: socketIOCorsOptions,
		});

		// a duplicate Redis client for subscribing to messages
		this._redisSubClient = redisClient.duplicate();

		this._redisSubClient.on("error", (err) =>
			logger.error(`WebSocket Redis subscriber error: ${err}`),
		);

		// Enable WebSocket messages to be distributed across multiple server instances
		this._io.adapter(createShardedAdapter(redisClient, this._redisSubClient));

		this._io.use(
			createSocketAuthMiddleware(
				this._tokenService,
				this._tokenRevocationRepository,
			),
		);

		this._setupHandlers();

		logger.info("WebSocket Server initialized");
	}

	private _setupHandlers(): void {
		if (!this._io) return;

		this._io.on("connection", (socket) => {
			const authedSocket = socket as AuthedSocket;
			const userId = authedSocket.data.user.id;

			logger.info(`User connected: ${userId} (${socket.id})`);

			socket.onAny((event, ...args: unknown[]) => {
				logger.info(
					`[WS IN] ${event} user=${userId} socket=${socket.id} args=${summarizeArgs(args)}`,
				);
			});

			socket.onAnyOutgoing((event, ...args: unknown[]) => {
				logger.info(
					`[WS OUT] ${event} user=${userId} socket=${socket.id} args=${summarizeArgs(args)}`,
				);
			});

			socket.join(userId);

			// Attach Call Handlers
			this._callHandler.attach(socket as AuthedSocket);

			socket.on("disconnect", () => {
				logger.info(`User disconnected: ${userId} (${socket.id})`);
			});
		});
	}

	/**
	 * Broadcasts an event to a specific user's room.
	 */
	public emitToUser(userId: string, event: string, payload: unknown): void {
		if (!this._io) {
			logger.warn("Attempted to emit to user but IO is not initialized");
			return;
		}
		this._io.to(userId).emit(event, payload);
	}

	public get io(): SocketIOServer | null {
		return this._io;
	}

	/**
	 * Gracefully closes the Redis subscriber connection.
	 */
	public async close(): Promise<void> {
		if (this._redisSubClient) {
			try {
				await this._redisSubClient.quit();
			} catch (error) {
				logger.error(`WebSocket Redis subscriber close error: ${error}`);
				this._redisSubClient.disconnect();
			} finally {
				this._redisSubClient = null;
			}
		}
	}
}

const summarizeArgs = (args: unknown[]): string => {
	const summarize = (value: unknown): string => {
		if (value === null) return "null";
		if (typeof value === "string") return `string(len=${value.length})`;
		if (
			typeof value === "number" ||
			typeof value === "boolean" ||
			typeof value === "bigint"
		) {
			return String(value);
		}
		if (Array.isArray(value)) return `array(len=${value.length})`;
		if (typeof value === "object") {
			return `object(keys=${Object.keys(value).length})`;
		}
		if (typeof value === "function") return "function";
		if (typeof value === "undefined") return "undefined";
		return typeof value;
	};

	return `[${args.map(summarize).join(", ")}]`;
};
