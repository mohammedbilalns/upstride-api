import type { Queue } from "bullmq";
import type { Redis } from "ioredis";
import mongoose from "mongoose";
import { redisClient } from "../../infrastructure/database/redis/redis.connection";
import { notificationQueue } from "../../main/di/queues.di";
import { QUEUE_NAMES } from "../constants";

export type HealthStatus = "up" | "down";

export interface HealthCheckResult {
	status: HealthStatus;
	latencyMs: number;
	details?: string;
}

export interface SystemHealthSnapshot {
	status: "ok" | "degraded";
	timestamp: string;
	uptimeSeconds: number;
	dependencies: {
		mongo: HealthCheckResult;
		redis: HealthCheckResult;
	};
	services: {
		notificationQueue: HealthCheckResult;
	};
}

const HEALTH_CHECK_TIMEOUT_MS = 2000;

const withTimeout = async <T>(
	promise: Promise<T>,
	timeoutMs: number,
): Promise<T> => {
	let timeoutId: NodeJS.Timeout | undefined;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`Timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
};

const checkMongo = async (): Promise<HealthCheckResult> => {
	const start = Date.now();
	try {
		if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
			throw new Error(
				`Mongo connection not ready (readyState=${mongoose.connection.readyState})`,
			);
		}

		await withTimeout(
			mongoose.connection.db.admin().ping(),
			HEALTH_CHECK_TIMEOUT_MS,
		);

		return { status: "up", latencyMs: Date.now() - start };
	} catch (error) {
		return {
			status: "down",
			latencyMs: Date.now() - start,
			details: (error as Error).message,
		};
	}
};

const checkRedis = async (): Promise<HealthCheckResult> => {
	const start = Date.now();
	try {
		await withTimeout(redisClient.ping(), HEALTH_CHECK_TIMEOUT_MS);
		return { status: "up", latencyMs: Date.now() - start };
	} catch (error) {
		return {
			status: "down",
			latencyMs: Date.now() - start,
			details: (error as Error).message,
		};
	}
};

const checkQueue = async (
	name: string,
	queue: Queue,
): Promise<HealthCheckResult> => {
	const start = Date.now();
	try {
		const client = await withTimeout(
			Promise.resolve(queue.client),
			HEALTH_CHECK_TIMEOUT_MS,
		);
		await withTimeout(
			(client as unknown as Redis).ping(),
			HEALTH_CHECK_TIMEOUT_MS,
		);
		return { status: "up", latencyMs: Date.now() - start };
	} catch (error) {
		return {
			status: "down",
			latencyMs: Date.now() - start,
			details: `${name}: ${(error as Error).message}`,
		};
	}
};

export const getSystemHealthSnapshot =
	async (): Promise<SystemHealthSnapshot> => {
		const [mongo, redis, notificationQueueHealth] = await Promise.all([
			checkMongo(),
			checkRedis(),
			checkQueue(QUEUE_NAMES.NOTIFICATION, notificationQueue),
		]);

		const dependencies = {
			mongo,
			redis,
		};
		const services = {
			notificationQueue: notificationQueueHealth,
		};
		const checks = [...Object.values(dependencies), ...Object.values(services)];
		const healthy = checks.every((check) => check.status === "up");

		return {
			status: healthy ? "ok" : "degraded",
			timestamp: new Date().toISOString(),
			uptimeSeconds: Math.floor(process.uptime()),
			dependencies,
			services,
		};
	};
