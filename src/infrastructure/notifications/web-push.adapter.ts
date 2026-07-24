import { injectable } from "inversify";
import webpush from "web-push";
import type { IPushNotificationPort as PushNotificationPort } from "../../application/services";
import env from "../../shared/config/env";

@injectable()
export class WebPushAdapter implements PushNotificationPort {
	constructor() {
		webpush.setVapidDetails(
			"mailto:support@upstride.com",
			env.VAPID_PUBLIC_KEY,
			env.VAPID_PRIVATE_KEY,
		);
	}

	async sendNotification(
		subscription: {
			endpoint: string;
			keys: { p256dh: string; auth: string };
		},
		payload: string,
	): Promise<void> {
		try {
			await webpush.sendNotification(subscription, payload);
		} catch (error: unknown) {
			const statusCode =
				typeof error === "object" && error !== null && "statusCode" in error
					? (error as { statusCode?: number }).statusCode
					: undefined;
			if (statusCode === 404 || statusCode === 410) {
				throw new Error("SUBSCRIPTION_EXPIRED");
			}
			throw error;
		}
	}
}
