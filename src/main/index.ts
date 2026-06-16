import {
	connectToMongo,
	disconnectFromMongo,
} from "../infrastructure/database/mongodb/mongodb.connection";
import {
	disconnectRedis,
	redisClient,
} from "../infrastructure/database/redis/redis.connection";
import env from "../shared/config/env";
import logger from "../shared/logging/logger";
import App from "./app";
import { bootstrapEventHandlers, notificationQueue } from "./di";
import { apiContainer } from "./di/api.container";
import { setupGracefulShutdown } from "./lifecyle/graceful-shutdown";

let appInstance: App;

async function start() {
	logger.info("Starting...");

	await Promise.all([connectToMongo(), redisClient.ping()]);

	// Initialize event handlers
	bootstrapEventHandlers(apiContainer);

	// initialize http server
	appInstance = new App();
	appInstance.listen(env.PORT);
}

setupGracefulShutdown({
	name: "API",
	tasks: [
		() => appInstance?.close(),
		() => disconnectFromMongo(),
		() => notificationQueue.close(),
		() => disconnectRedis(),
	],
});

start();
