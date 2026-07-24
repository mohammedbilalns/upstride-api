import { describe, expect, it } from "vitest";
import { calculateBookingAmount } from "../../../../../src/application/modules/booking/utils/calculate-booking-amount.util";
import { COIN_VALUE } from "../../../../../src/shared/constants/app.constants";

describe("calculate-booking-amount.util", () => {
	describe("calculateBookingAmount", () => {
		it("should calculate correct amounts for a 30-minute session", () => {
			const start = new Date("2025-01-01T10:00:00.000Z");
			const end = new Date("2025-01-01T10:30:00.000Z");
			const pricePer30Min = 1000;

			const result = calculateBookingAmount(pricePer30Min, start, end);

			expect(result.totalAmountCoins).toBe(1000);
			expect(result.totalAmountCurrency).toBe(1000 / COIN_VALUE);
		});

		it("should calculate correct amounts for a 60-minute session", () => {
			const start = new Date("2025-01-01T10:00:00.000Z");
			const end = new Date("2025-01-01T11:00:00.000Z");
			const pricePer30Min = 1000;

			const result = calculateBookingAmount(pricePer30Min, start, end);

			expect(result.totalAmountCoins).toBe(2000);
			expect(result.totalAmountCurrency).toBe(2000 / COIN_VALUE);
		});

		it("should calculate correct amounts for a 90-minute session", () => {
			const start = new Date("2025-01-01T10:00:00.000Z");
			const end = new Date("2025-01-01T11:30:00.000Z");
			const pricePer30Min = 600;

			const result = calculateBookingAmount(pricePer30Min, start, end);

			// 90min / 30 = 3 slots * 600 = 1800 coins
			expect(result.totalAmountCoins).toBe(1800);
			expect(result.totalAmountCurrency).toBe(1800 / COIN_VALUE);
		});

		it("should return zero coins for a zero-duration session", () => {
			const start = new Date("2025-01-01T10:00:00.000Z");
			const end = new Date("2025-01-01T10:00:00.000Z");
			const pricePer30Min = 1000;

			const result = calculateBookingAmount(pricePer30Min, start, end);

			expect(result.totalAmountCoins).toBe(0);
			expect(result.totalAmountCurrency).toBe(0);
		});

		it("should handle a free session (price of 0)", () => {
			const start = new Date("2025-01-01T10:00:00.000Z");
			const end = new Date("2025-01-01T11:00:00.000Z");
			const pricePer30Min = 0;

			const result = calculateBookingAmount(pricePer30Min, start, end);

			expect(result.totalAmountCoins).toBe(0);
			expect(result.totalAmountCurrency).toBe(0);
		});

		it("should calculate proportional amounts for fractional slots", () => {
			const start = new Date("2025-01-01T10:00:00.000Z");
			const end = new Date("2025-01-01T10:15:00.000Z");
			const pricePer30Min = 1000;

			const result = calculateBookingAmount(pricePer30Min, start, end);

			// 15 min / 30 = 0.5 slots * 1000 = 500 coins
			expect(result.totalAmountCoins).toBe(500);
			expect(result.totalAmountCurrency).toBe(500 / COIN_VALUE);
		});
	});
});
