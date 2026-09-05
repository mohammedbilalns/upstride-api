import { describe, expect, it } from "vitest";
import { PaymentProvider } from "../../../../src/domain/entities/payment-transactions.entity";
import { CheckoutCompletedEvent } from "../../../../src/domain/events/checkout-completed.event";
import { CheckoutExpiredEvent } from "../../../../src/domain/events/checkout-expired.event";
import { CheckoutFailedEvent } from "../../../../src/domain/events/checkout-failed.event";

describe("Checkout Domain Events", () => {
	it("CheckoutCompletedEvent should have correct properties", () => {
		const event = new CheckoutCompletedEvent({
			type: "checkout.session.completed",
			provider: PaymentProvider.Stripe,
			sessionId: "session-1",
			userId: "user-1",
			coins: 100,
			amountMinor: 10000,
			currency: "USD",
		});

		expect(event.eventName).toBe("checkout.completed");
		expect(event.payload.sessionId).toBe("session-1");
		expect(event.occurredAt).toBeInstanceOf(Date);
	});

	it("CheckoutExpiredEvent should have correct properties", () => {
		const event = new CheckoutExpiredEvent({
			type: "checkout.session.expired",
			provider: PaymentProvider.Stripe,
			sessionId: "session-1",
			coins: 100,
			amountMinor: 10000,
			currency: "USD",
		});

		expect(event.eventName).toBe("checkout.expired");
		expect(event.occurredAt).toBeInstanceOf(Date);
	});

	it("CheckoutFailedEvent should have correct properties", () => {
		const event = new CheckoutFailedEvent({
			type: "checkout.session.async_payment_failed",
			provider: PaymentProvider.Stripe,
			sessionId: "session-1",
			coins: 100,
			amountMinor: 10000,
			currency: "USD",
		});

		expect(event.eventName).toBe("checkout.failed");
		expect(event.occurredAt).toBeInstanceOf(Date);
	});

	it("checkout completed event should preserve payment details", () => {
		const payload = {
			type: "checkout.session.completed" as const,
			provider: PaymentProvider.Stripe,
			sessionId: "session-abc",
			userId: "user-xyz",
			coins: 500,
			amountMinor: 50000,
			currency: "USD",
			metadata: { orderId: "order-1" },
		};

		const event = new CheckoutCompletedEvent(payload);

		expect(event.payload.coins).toBe(500);
		expect(event.payload.amountMinor).toBe(50000);
		expect(event.payload.metadata).toEqual({ orderId: "order-1" });
	});

	it("all checkout events should have occurredAt timestamp", () => {
		const events = [
			new CheckoutCompletedEvent({
				type: "checkout.session.completed",
				provider: PaymentProvider.Stripe,
				sessionId: "s-1",
				coins: 10,
				amountMinor: 1000,
				currency: "USD",
			}),
			new CheckoutExpiredEvent({
				type: "checkout.session.expired",
				provider: PaymentProvider.Stripe,
				sessionId: "s-2",
				coins: 10,
				amountMinor: 1000,
				currency: "USD",
			}),
			new CheckoutFailedEvent({
				type: "checkout.session.async_payment_failed",
				provider: PaymentProvider.Stripe,
				sessionId: "s-3",
				coins: 10,
				amountMinor: 1000,
				currency: "USD",
			}),
		];

		events.forEach((event) => {
			expect(event.occurredAt).toBeInstanceOf(Date);
			expect(event.occurredAt.getTime()).toBeGreaterThan(0);
		});
	});
});
