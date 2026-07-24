import { describe, expect, it } from "vitest";
import {
	PushSubscription,
	type PushSubscriptionKeys,
} from "../../../../src/domain/entities/push-subscription.entity";

describe("PushSubscription Entity", () => {
	const mockKeys: PushSubscriptionKeys = {
		p256dh: "base64-encoded-p256dh-key",
		auth: "base64-encoded-auth-key",
	};

	describe("constructor", () => {
		it("should create a valid push subscription", () => {
			const subscription = new PushSubscription(
				"user-1",
				"https://push.service.com/v1/subscription-123",
				mockKeys,
				"desktop",
			);

			expect(subscription.userId).toBe("user-1");
			expect(subscription.endpoint).toBe(
				"https://push.service.com/v1/subscription-123",
			);
			expect(subscription.keys).toEqual(mockKeys);
			expect(subscription.deviceType).toBe("desktop");
		});

		it("should allow optional device type", () => {
			const subscription = new PushSubscription(
				"user-2",
				"https://push.service.com/v1/subscription-456",
				mockKeys,
			);

			expect(subscription.deviceType).toBeUndefined();
		});

		it("should store subscription with mobile device type", () => {
			const subscription = new PushSubscription(
				"user-3",
				"https://push.service.com/v1/subscription-789",
				mockKeys,
				"mobile",
			);

			expect(subscription.deviceType).toBe("mobile");
		});

		it("should store subscription with tablet device type", () => {
			const subscription = new PushSubscription(
				"user-4",
				"https://push.service.com/v1/subscription-101",
				mockKeys,
				"tablet",
			);

			expect(subscription.deviceType).toBe("tablet");
		});
	});

	describe("create", () => {
		it("should create subscription from raw data", () => {
			const rawData = {
				userId: "user-5",
				endpoint: "https://push.service.com/v1/subscription-202",
				keys: mockKeys,
				deviceType: "desktop",
			};

			const subscription = PushSubscription.create(rawData);

			expect(subscription.userId).toBe(rawData.userId);
			expect(subscription.endpoint).toBe(rawData.endpoint);
			expect(subscription.keys).toEqual(rawData.keys);
			expect(subscription.deviceType).toBe(rawData.deviceType);
		});

		it("should create subscription without device type", () => {
			const rawData = {
				userId: "user-6",
				endpoint: "https://push.service.com/v1/subscription-303",
				keys: mockKeys,
			};

			const subscription = PushSubscription.create(rawData);

			expect(subscription.deviceType).toBeUndefined();
		});
	});

	describe("toRaw", () => {
		it("should convert to raw format", () => {
			const subscription = new PushSubscription(
				"user-7",
				"https://push.service.com/v1/subscription-404",
				mockKeys,
				"mobile",
			);

			const raw = subscription.toRaw();

			expect(raw.userId).toBe("user-7");
			expect(raw.endpoint).toBe("https://push.service.com/v1/subscription-404");
			expect(raw.keys).toEqual(mockKeys);
			expect(raw.deviceType).toBe("mobile");
		});

		it("should handle subscription without device type in toRaw", () => {
			const subscription = new PushSubscription(
				"user-8",
				"https://push.service.com/v1/subscription-505",
				mockKeys,
			);

			const raw = subscription.toRaw();

			expect(raw.deviceType).toBeUndefined();
		});

		it("should round-trip correctly through create and toRaw", () => {
			const rawData = {
				userId: "user-9",
				endpoint: "https://push.service.com/v1/subscription-606",
				keys: mockKeys,
				deviceType: "tablet" as const,
			};

			const subscription = PushSubscription.create(rawData);
			const roundTripped = subscription.toRaw();

			expect(roundTripped).toEqual(rawData);
		});
	});
});
