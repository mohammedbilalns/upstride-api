import pino from "pino";
import env from "../config/env";
import { RequestContext } from "../context/request-context";

const hasLokiConfig = Boolean(
	env.LOKI_HOST && env.LOKI_USER && env.LOKI_PASSWORD,
);

const transport = (() => {
	if (env.NODE_ENV === "development") {
		try {
			return pino.transport({
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
					ignore: "pid,hostname",
				},
			});
		} catch {
			return undefined;
		}
	}

	if (!hasLokiConfig) {
		return undefined;
	}

	try {
		return pino.transport({
			target: "pino-loki",
			options: {
				batching: true,
				interval: 5,
				host: env.LOKI_HOST,
				endpoint: `${env.LOKI_HOST}/loki/api/v1/push`,
				basicAuth: {
					username: env.LOKI_USER,
					password: env.LOKI_PASSWORD,
				},
				debugDiagnostics: false,
				labels: { app: "upstride-backend", env: env.NODE_ENV },
				format: true,
			},
		});
	} catch {
		return undefined;
	}
})();

const logger = pino(
	{
		level: env.LOG_LEVEL,
		timestamp: pino.stdTimeFunctions.epochTime,
		errorKey: "stack",
		// Auto-attach requestId from the current async context to every log entry
		mixin: () => {
			const requestId = RequestContext.getRequestId();
			return requestId ? { requestId } : {};
		},
		redact: ["password", "token", "apiKey", "req.headers.authorization"],
	},
	transport,
);

export default logger;
