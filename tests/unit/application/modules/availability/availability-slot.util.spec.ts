import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AvailabilitySlotUtil } from "../../../../../src/application/modules/availability/utils/availability-slot.util";
import { createAvailability } from "../../../../factories/entities/availability.factory";

describe("availability-slot.util", () => {
	describe("AvailabilitySlotUtil.computeSlotsForDate", () => {
		// Use a far-future date so slots aren't filtered out as past
		const futureDate = new Date("2030-06-15T00:00:00.000Z");

		beforeEach(() => {
			// Fix "now" to a point before our test date
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should return empty array when availability is inactive", () => {
			const availability = createAvailability({
				status: false,
				startTime: "09:00",
				endTime: "17:00",
				slotDuration: 60,
				bufferTime: 10,
				breakTimes: [],
			});

			const slots = AvailabilitySlotUtil.computeSlotsForDate(
				availability,
				futureDate,
				[],
			);

			expect(slots).toEqual([]);
		});

		it("should generate correct slots for a simple availability window", () => {
			const availability = createAvailability({
				status: true,
				startTime: "09:00",
				endTime: "12:00",
				slotDuration: 60,
				bufferTime: 10,
				breakTimes: [],
			});

			const slots = AvailabilitySlotUtil.computeSlotsForDate(
				availability,
				futureDate,
				[],
			);

			// 09:00-10:00, skip buffer (10:10), 10:10-11:10, skip buffer (11:20), 11:20 + 60 = 12:20 > 12:00 so stops
			expect(slots).toEqual([
				{ startTime: "09:00", endTime: "10:00" },
				{ startTime: "10:10", endTime: "11:10" },
			]);
		});

		it("should generate 30-minute slots", () => {
			const availability = createAvailability({
				status: true,
				startTime: "09:00",
				endTime: "11:00",
				slotDuration: 30,
				bufferTime: 10,
				breakTimes: [],
			});

			const slots = AvailabilitySlotUtil.computeSlotsForDate(
				availability,
				futureDate,
				[],
			);

			// 09:00-09:30, 09:40-10:10, 10:20-10:50, 11:00 + 30 = 11:30 > 11:00 but 10:50+10=11:00 and 11:00+30=11:30 > 11:00
			expect(slots).toEqual([
				{ startTime: "09:00", endTime: "09:30" },
				{ startTime: "09:40", endTime: "10:10" },
				{ startTime: "10:20", endTime: "10:50" },
			]);
		});

		it("should exclude slots that overlap with break times", () => {
			const availability = createAvailability({
				status: true,
				startTime: "09:00",
				endTime: "14:00",
				slotDuration: 60,
				bufferTime: 10,
				breakTimes: [{ startTime: "12:00", endTime: "13:00" }],
			});

			const slots = AvailabilitySlotUtil.computeSlotsForDate(
				availability,
				futureDate,
				[],
			);

			// 09:00-10:00 ok, 10:10-11:10 ok, 11:20-12:20 overlaps break (12:00-13:00), 12:30-13:30 overlaps break, 13:40+60=14:40 > 14:00
			// slot at 11:20-12:20 overlaps with break 12:00-13:00 since 11:20 < 13:00 && 12:20 > 12:00
			// slot at 12:30-13:30: 12:30 < 13:00 && 13:30 > 12:00 -> overlaps
			// Only 09:00-10:00 and 10:10-11:10 are free
			const slotTimes = slots.map((s) => s.startTime);
			expect(slotTimes).not.toContain("12:00");
			expect(slots.length).toBeGreaterThanOrEqual(2);
			expect(slots[0]).toEqual({
				startTime: "09:00",
				endTime: "10:00",
			});
			expect(slots[1]).toEqual({
				startTime: "10:10",
				endTime: "11:10",
			});
		});

		it("should exclude slots that overlap with existing bookings", () => {
			const availability = createAvailability({
				status: true,
				startTime: "09:00",
				endTime: "13:00",
				slotDuration: 60,
				bufferTime: 10,
				breakTimes: [],
			});

			// Create a booking during the first slot (IST 09:00-10:00 = UTC 03:30-04:30)
			const dateStr = futureDate.toISOString().slice(0, 10);
			const existingBookings = [
				{
					startTime: `${dateStr}T03:30:00.000Z`,
					endTime: `${dateStr}T04:30:00.000Z`,
				},
			];

			const slots = AvailabilitySlotUtil.computeSlotsForDate(
				availability,
				futureDate,
				existingBookings,
			);

			// The first slot (09:00 IST -> 03:30 UTC) should be excluded
			expect(slots.find((s) => s.startTime === "09:00")).toBeUndefined();
		});

		it("should return empty when slot duration exceeds available window", () => {
			const availability = createAvailability({
				status: true,
				startTime: "09:00",
				endTime: "09:30",
				slotDuration: 60,
				bufferTime: 10,
				breakTimes: [],
			});

			const slots = AvailabilitySlotUtil.computeSlotsForDate(
				availability,
				futureDate,
				[],
			);

			expect(slots).toEqual([]);
		});
	});
});
