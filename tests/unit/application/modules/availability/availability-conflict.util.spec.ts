import { describe, expect, it } from "vitest";
import { isAvailabilityConflict } from "../../../../../src/application/modules/availability/utils/availability-conflict.util";
import { createAvailability } from "../../../../factories/entities/availability.factory";

describe("availability-conflict.util", () => {
	describe("isAvailabilityConflict", () => {
		it("should return false when date ranges do not overlap", () => {
			const candidate = {
				days: new Set(["Monday" as const]),
				startTime: "09:00",
				endTime: "10:00",
				startDate: "2025-01-01",
				endDate: "2025-01-31",
			};

			const existing = createAvailability({
				days: new Set(["Monday"]),
				startTime: "09:00",
				endTime: "10:00",
				startDate: "2025-03-01",
				endDate: "2025-03-31",
			});

			expect(isAvailabilityConflict(candidate, existing)).toBe(false);
		});

		it("should return false when days do not overlap", () => {
			const candidate = {
				days: new Set(["Monday" as const]),
				startTime: "09:00",
				endTime: "10:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			};

			const existing = createAvailability({
				days: new Set(["Tuesday"]),
				startTime: "09:00",
				endTime: "10:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			});

			expect(isAvailabilityConflict(candidate, existing)).toBe(false);
		});

		it("should return false when time ranges do not overlap", () => {
			const candidate = {
				days: new Set(["Monday" as const]),
				startTime: "09:00",
				endTime: "10:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			};

			const existing = createAvailability({
				days: new Set(["Monday"]),
				startTime: "14:00",
				endTime: "16:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			});

			expect(isAvailabilityConflict(candidate, existing)).toBe(false);
		});

		it("should return true when dates, days, and times all overlap", () => {
			const candidate = {
				days: new Set(["Monday" as const]),
				startTime: "09:00",
				endTime: "11:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			};

			const existing = createAvailability({
				days: new Set(["Monday"]),
				startTime: "10:00",
				endTime: "12:00",
				startDate: "2025-06-01",
				endDate: "2025-12-31",
			});

			expect(isAvailabilityConflict(candidate, existing)).toBe(true);
		});

		it("should return true when candidate completely contains existing", () => {
			const candidate = {
				days: new Set(["Monday" as const, "Tuesday" as const]),
				startTime: "08:00",
				endTime: "18:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			};

			const existing = createAvailability({
				days: new Set(["Monday"]),
				startTime: "10:00",
				endTime: "12:00",
				startDate: "2025-03-01",
				endDate: "2025-06-30",
			});

			expect(isAvailabilityConflict(candidate, existing)).toBe(true);
		});

		it("should return false when candidate ends exactly when existing starts", () => {
			const candidate = {
				days: new Set(["Monday" as const]),
				startTime: "09:00",
				endTime: "10:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			};

			const existing = createAvailability({
				days: new Set(["Monday"]),
				startTime: "10:00",
				endTime: "12:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			});

			expect(isAvailabilityConflict(candidate, existing)).toBe(false);
		});

		it("should return false when candidate starts exactly when existing ends", () => {
			const candidate = {
				days: new Set(["Monday" as const]),
				startTime: "12:00",
				endTime: "14:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			};

			const existing = createAvailability({
				days: new Set(["Monday"]),
				startTime: "10:00",
				endTime: "12:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			});

			expect(isAvailabilityConflict(candidate, existing)).toBe(false);
		});

		it("should detect overlap when multiple days have shared overlap", () => {
			const candidate = {
				days: new Set([
					"Monday" as const,
					"Wednesday" as const,
					"Friday" as const,
				]),
				startTime: "09:00",
				endTime: "11:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			};

			const existing = createAvailability({
				days: new Set(["Wednesday", "Thursday"]),
				startTime: "10:00",
				endTime: "12:00",
				startDate: "2025-01-01",
				endDate: "2025-12-31",
			});

			expect(isAvailabilityConflict(candidate, existing)).toBe(true);
		});

		it("should detect overlap at date range boundaries", () => {
			const candidate = {
				days: new Set(["Monday" as const]),
				startTime: "09:00",
				endTime: "11:00",
				startDate: "2025-01-01",
				endDate: "2025-06-30",
			};

			const existing = createAvailability({
				days: new Set(["Monday"]),
				startTime: "10:00",
				endTime: "12:00",
				startDate: "2025-06-30",
				endDate: "2025-12-31",
			});

			expect(isAvailabilityConflict(candidate, existing)).toBe(true);
		});
	});
});
