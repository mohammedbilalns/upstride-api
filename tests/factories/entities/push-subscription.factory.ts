import { PushSubscription } from "../../../src/domain/entities/push-subscription.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createPushSubscription(
	overrides: Partial<PushSubscription> = {},
): PushSubscription {
	const data = mergeDefaults<PushSubscription>(
		{
			userId: "user-1",
			endpoint: "https://push.example.com/subscription",
			keys: {
				p256dh: "test-p256dh",
				auth: "test-auth",
			},
			deviceType: "desktop",
		},
		overrides,
	);

	return new PushSubscription(
		data.userId,
		data.endpoint,
		data.keys,
		data.deviceType,
	);
}
