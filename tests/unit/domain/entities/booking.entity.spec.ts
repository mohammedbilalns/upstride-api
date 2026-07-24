import { describe, expect, it } from "vitest";
import { Booking } from "../../../../src/domain/entities/booking.entity";
import { EntityValidationError } from "../../../../src/domain/errors/entity-validation.error";

describe("Booking Entity", () => {
	describe("create static method", () => {
		it("should throw when mentor equals mentee", () => {
			const now = new Date();
			const startTime = new Date(now.getTime() + 3600000).toISOString();
			const endTime = new Date(now.getTime() + 7200000).toISOString();

			expect(() => {
				Booking.create({
					mentorId: "m1",
					menteeId: "m1",
					startTime,
					endTime,
					meetingLink: "https://meet.example.com",
					paymentType: "COINS",
					paymentStatus: "PENDING",
					totalAmount: 100,
					currency: "INR",
				});
			}).toThrow(EntityValidationError);
		});

		it("should throw when start time after end time", () => {
			const now = new Date();
			const startTime = new Date(now.getTime() + 7200000).toISOString();
			const endTime = new Date(now.getTime() + 3600000).toISOString();

			expect(() => {
				Booking.create({
					mentorId: "m1",
					menteeId: "u1",
					startTime,
					endTime,
					meetingLink: "https://meet.example.com",
					paymentType: "COINS",
					paymentStatus: "PENDING",
					totalAmount: 100,
					currency: "INR",
				});
			}).toThrow(EntityValidationError);
		});

		it("should throw when booking in past", () => {
			const now = new Date();
			const startTime = new Date(now.getTime() - 7200000).toISOString();
			const endTime = new Date(now.getTime() - 3600000).toISOString();

			expect(() => {
				Booking.create({
					mentorId: "m1",
					menteeId: "u1",
					startTime,
					endTime,
					meetingLink: "https://meet.example.com",
					paymentType: "COINS",
					paymentStatus: "PENDING",
					totalAmount: 100,
					currency: "INR",
				});
			}).toThrow(EntityValidationError);
		});

		it("should create valid booking", () => {
			const now = new Date();
			const startTime = new Date(now.getTime() + 3600000).toISOString();
			const endTime = new Date(now.getTime() + 7200000).toISOString();

			const booking = Booking.create({
				mentorId: "m1",
				menteeId: "u1",
				startTime,
				endTime,
				meetingLink: "https://meet.example.com",
				paymentType: "COINS",
				paymentStatus: "PENDING",
				totalAmount: 100,
				currency: "INR",
			});

			expect((booking as unknown as Record<string, unknown>).mentorId).toBe(
				"m1",
			);
			expect((booking as unknown as Record<string, unknown>).menteeId).toBe(
				"u1",
			);
		});
	});

	describe("assertCanBook static method", () => {
		it("should throw when booker is mentor", () => {
			expect(() => Booking.assertCanBook("m1", "m1")).toThrow(
				EntityValidationError,
			);
		});

		it("should allow when booker is not mentor", () => {
			expect(() => Booking.assertCanBook("m1", "u1")).not.toThrow();
		});
	});

	describe("assertCancellable static method", () => {
		it("should allow PENDING", () => {
			expect(() => Booking.assertCancellable("PENDING")).not.toThrow();
		});

		it("should allow CONFIRMED", () => {
			expect(() => Booking.assertCancellable("CONFIRMED")).not.toThrow();
		});

		it("should throw for COMPLETED", () => {
			expect(() => Booking.assertCancellable("COMPLETED")).toThrow(
				EntityValidationError,
			);
		});

		it("should throw for CANCELLED_BY_MENTEE", () => {
			expect(() => Booking.assertCancellable("CANCELLED_BY_MENTEE")).toThrow(
				EntityValidationError,
			);
		});

		it("should throw for CANCELLED_BY_MENTOR", () => {
			expect(() => Booking.assertCancellable("CANCELLED_BY_MENTOR")).toThrow(
				EntityValidationError,
			);
		});

		it("should throw for STARTED", () => {
			expect(() => Booking.assertCancellable("STARTED")).toThrow(
				EntityValidationError,
			);
		});
	});

	describe("constructor", () => {
		it("should allow all booking statuses", () => {
			const now = new Date();
			const timeStr = now.toISOString();
			const endTimeStr = new Date(now.getTime() + 3600000).toISOString();

			const statuses: Array<
				| "PENDING"
				| "CONFIRMED"
				| "CANCELLED_BY_MENTEE"
				| "CANCELLED_BY_MENTOR"
				| "SLOT_TAKEN_BY_ANOTHER_USER"
				| "STARTED"
				| "COMPLETED"
			> = [
				"PENDING",
				"CONFIRMED",
				"CANCELLED_BY_MENTEE",
				"CANCELLED_BY_MENTOR",
				"SLOT_TAKEN_BY_ANOTHER_USER",
				"STARTED",
				"COMPLETED",
			];

			statuses.forEach((status) => {
				const booking = new Booking(
					"b1",
					"m1",
					"mu1",
					"u1",
					timeStr,
					endTimeStr,
					status,
					"url",
					"COINS",
					"PENDING",
					100,
					"INR",
					"",
					"",
					"",
					null,
					null,
					null,
					now,
					now,
				);
				expect(booking.status).toBe(status);
			});
		});

		it("should allow all payment types", () => {
			const now = new Date();
			const timeStr = now.toISOString();
			const endTimeStr = new Date(now.getTime() + 3600000).toISOString();

			const types: Array<"COINS" | "STRIPE"> = ["COINS", "STRIPE"];

			types.forEach((type) => {
				const booking = new Booking(
					"b1",
					"m1",
					"mu1",
					"u1",
					timeStr,
					endTimeStr,
					"PENDING",
					"url",
					type,
					"PENDING",
					100,
					"INR",
					"",
					"",
					"",
					null,
					null,
					null,
					now,
					now,
				);
				expect(booking.paymentType).toBe(type);
			});
		});

		it("should allow all payment statuses", () => {
			const now = new Date();
			const timeStr = now.toISOString();
			const endTimeStr = new Date(now.getTime() + 3600000).toISOString();

			const statuses: Array<"PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"> = [
				"PENDING",
				"COMPLETED",
				"FAILED",
				"REFUNDED",
			];

			statuses.forEach((status) => {
				const booking = new Booking(
					"b1",
					"m1",
					"mu1",
					"u1",
					timeStr,
					endTimeStr,
					"PENDING",
					"url",
					"COINS",
					status,
					100,
					"INR",
					"",
					"",
					"",
					null,
					null,
					null,
					now,
					now,
				);
				expect(booking.paymentStatus).toBe(status);
			});
		});
	});
});
