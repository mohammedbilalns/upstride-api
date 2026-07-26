import { describe, expect, it } from "vitest";
import { SessionRefundedEvent } from "../../../../src/domain/events/session-refunded.event";

describe("SessionRefundedEvent", () => {
	it("should have correct properties", () => {
		const event = new SessionRefundedEvent({
			bookingId: "booking-1",
			userId: "user-1",
			refundAmount: 100,
			refundPercentage: 100,
			reason: "Mentor no-show",
			paymentType: "STRIPE",
			paymentStatus: "REFUNDED",
		});

		expect(event.eventName).toBe("session.refunded");
		expect(event.payload.refundAmount).toBe(100);
		expect(event.occurredAt).toBeInstanceOf(Date);
	});

	it("should include all refund details", () => {
		const event = new SessionRefundedEvent({
			bookingId: "booking-1",
			userId: "user-1",
			refundAmount: 250,
			refundPercentage: 50,
			reason: "User requested cancellation",
			paymentType: "COINS",
			paymentStatus: "REFUNDED",
		});

		expect(event.payload.refundAmount).toBe(250);
		expect(event.payload.refundPercentage).toBe(50);
		expect(event.payload.paymentStatus).toBe("REFUNDED");
	});
});
