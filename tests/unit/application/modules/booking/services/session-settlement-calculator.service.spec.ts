import { describe, expect, it } from "vitest";
import { SessionSettlementCalculatorService } from "../../../../../../src/application/modules/booking/services/session-settlement-calculator.service";
import type { Booking } from "../../../../../../src/domain/entities/booking.entity";
import {
	COIN_VALUE,
	PLATFOM_COMMISSION,
} from "../../../../../../src/shared/constants";

describe("SessionSettlementCalculatorService", () => {
	const calculator = new SessionSettlementCalculatorService();

	const mockBooking = (
		totalAmount: number,
		paymentType: "COINS" | "STRIPE",
	): Booking =>
		({
			totalAmount,
			paymentType,
		}) as Booking;

	describe("calculate", () => {
		it("should calculate correctly for COINS payment", () => {
			const booking = mockBooking(100, "COINS");
			const mentorPercentage = 100 - PLATFOM_COMMISSION.SESSION_PERCENTAGE;

			const result = calculator.calculate(booking);

			expect(result.mentorCoins).toBe(
				Math.round((100 * mentorPercentage) / 100),
			);
			expect(result.refundCoins).toBe(100);

			// Minor unit calculations
			const expectedMinor = Math.round((100 / COIN_VALUE) * 100);
			expect(result.refundMinor).toBe(expectedMinor);
			expect(result.mentorPayoutMinor).toBe(
				Math.round(expectedMinor * (mentorPercentage / 100)),
			);
		});

		it("should calculate correctly for STRIPE payment", () => {
			const booking = mockBooking(50, "STRIPE"); // $50
			const mentorPercentage = 100 - PLATFOM_COMMISSION.SESSION_PERCENTAGE;

			const result = calculator.calculate(booking);

			expect(result.refundMinor).toBe(50 * 100); // 5000 cents
			expect(result.refundCoins).toBe(Math.round(50 * COIN_VALUE));

			expect(result.mentorPayoutMinor).toBe(
				Math.round(50 * 100 * (mentorPercentage / 100)),
			);
			expect(result.mentorCoins).toBe(
				Math.round(50 * COIN_VALUE * (mentorPercentage / 100)),
			);
		});

		it("should handle zero amount", () => {
			const booking = mockBooking(0, "STRIPE");
			const result = calculator.calculate(booking);

			expect(result.mentorCoins).toBe(0);
			expect(result.mentorPayoutMinor).toBe(0);
			expect(result.refundCoins).toBe(0);
			expect(result.refundMinor).toBe(0);
		});
	});
});
