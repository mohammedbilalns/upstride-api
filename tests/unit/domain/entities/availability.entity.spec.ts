import { describe, expect, it } from "vitest";
import { Availability } from "../../../../src/domain/entities/availability.entity";
import { EntityValidationError } from "../../../../src/domain/errors";

describe("Availability Entity", () => {
	describe("create", () => {
		it("should create valid availability", () => {
			const availability = Availability.create({
				mentorId: "mentor-1",
				name: "Weekly Sessions",
				description: "Available for mentoring",
				days: new Set(["Monday", "Wednesday", "Friday"] as const),
				startTime: "09:00",
				endTime: "17:00",
				startDate: "2026-08-01",
				endDate: "2026-12-31",
				breakTimes: [{ startTime: "12:00", endTime: "13:00" }],
				slotDuration: 60,
				bufferTime: 15,
				status: true,
			});

			expect(availability.mentorId).toBe("mentor-1");
			expect(availability.slotDuration).toBe(60);
			expect(availability.days.size).toBe(3);
		});

		it("should throw when no days selected", () => {
			expect(() =>
				Availability.create({
					mentorId: "mentor-1",
					name: "Weekly Sessions",
					description: "Available for mentoring",
					days: new Set(),
					startTime: "09:00",
					endTime: "17:00",
					startDate: "2026-08-01",
					endDate: "2026-12-31",
					breakTimes: [],
					slotDuration: 60,
					bufferTime: 15,
					status: true,
				}),
			).toThrow(EntityValidationError);
		});

		it("should throw for invalid time range", () => {
			expect(() =>
				Availability.create({
					mentorId: "mentor-1",
					name: "Weekly Sessions",
					description: "Available for mentoring",
					days: new Set(["Monday"] as const),
					startTime: "25:00",
					endTime: "17:00",
					startDate: "2026-08-01",
					endDate: "2026-12-31",
					breakTimes: [],
					slotDuration: 60,
					bufferTime: 15,
					status: true,
				}),
			).toThrow(EntityValidationError);
		});

		it("should throw when duration is less than 1 hour", () => {
			expect(() =>
				Availability.create({
					mentorId: "mentor-1",
					name: "Short Session",
					description: "Available for mentoring",
					days: new Set(["Monday"] as const),
					startTime: "09:00",
					endTime: "09:30",
					startDate: "2026-08-01",
					endDate: "2026-12-31",
					breakTimes: [],
					slotDuration: 60,
					bufferTime: 15,
					status: true,
				}),
			).toThrow(EntityValidationError);
		});

		it("should throw when startDate is after or equal to endDate", () => {
			expect(() =>
				Availability.create({
					mentorId: "mentor-1",
					name: "Weekly Sessions",
					description: "Available for mentoring",
					days: new Set(["Monday"] as const),
					startTime: "09:00",
					endTime: "17:00",
					startDate: "2026-12-31",
					endDate: "2026-08-01",
					breakTimes: [],
					slotDuration: 60,
					bufferTime: 15,
					status: true,
				}),
			).toThrow(EntityValidationError);
		});

		it("should throw when bufferTime is less than 5 minutes", () => {
			expect(() =>
				Availability.create({
					mentorId: "mentor-1",
					name: "Weekly Sessions",
					description: "Available for mentoring",
					days: new Set(["Monday"] as const),
					startTime: "09:00",
					endTime: "17:00",
					startDate: "2026-08-01",
					endDate: "2026-12-31",
					breakTimes: [],
					slotDuration: 60,
					bufferTime: 2,
					status: true,
				}),
			).toThrow(EntityValidationError);
		});

		it("should throw when bufferTime is more than 60 minutes", () => {
			expect(() =>
				Availability.create({
					mentorId: "mentor-1",
					name: "Weekly Sessions",
					description: "Available for mentoring",
					days: new Set(["Monday"] as const),
					startTime: "09:00",
					endTime: "17:00",
					startDate: "2026-08-01",
					endDate: "2026-12-31",
					breakTimes: [],
					slotDuration: 60,
					bufferTime: 90,
					status: true,
				}),
			).toThrow(EntityValidationError);
		});

		it("should throw when bufferTime is equal to or greater than slotDuration", () => {
			expect(() =>
				Availability.create({
					mentorId: "mentor-1",
					name: "Weekly Sessions",
					description: "Available for mentoring",
					days: new Set(["Monday"] as const),
					startTime: "09:00",
					endTime: "17:00",
					startDate: "2026-08-01",
					endDate: "2026-12-31",
					breakTimes: [],
					slotDuration: 30,
					bufferTime: 30,
					status: true,
				}),
			).toThrow(EntityValidationError);
		});

		it("should allow 30 min slot duration", () => {
			const availability = Availability.create({
				mentorId: "mentor-1",
				name: "Quick Sessions",
				description: "Available for mentoring",
				days: new Set(["Monday"] as const),
				startTime: "09:00",
				endTime: "17:00",
				startDate: "2026-08-01",
				endDate: "2026-12-31",
				breakTimes: [],
				slotDuration: 30,
				bufferTime: 15,
				status: true,
			});

			expect(availability.slotDuration).toBe(30);
		});

		it("should allow all days of the week", () => {
			const allDays = new Set([
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday",
				"Sunday",
			] as const);

			const availability = Availability.create({
				mentorId: "mentor-1",
				name: "Full Week",
				description: "Available for mentoring",
				days: allDays,
				startTime: "09:00",
				endTime: "17:00",
				startDate: "2026-08-01",
				endDate: "2026-12-31",
				breakTimes: [],
				slotDuration: 60,
				bufferTime: 15,
				status: true,
			});

			expect(availability.days.size).toBe(7);
		});
	});
});
