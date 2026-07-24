import { describe, expect, it } from "vitest";
import {
	Booking,
	type BookingStatus,
} from "../../../../src/domain/entities/booking.entity";
import { EntityValidationError } from "../../../../src/domain/errors";

describe("Booking Entity", () => {
	describe("create", () => {
		it("should create valid booking", () => {
			const futureDate = new Date();
			futureDate.setHours(futureDate.getHours() + 2);
			const endDate = new Date(futureDate);
			endDate.setHours(endDate.getHours() + 1);

			const booking = Booking.create({
				mentorId: "mentor-1",
				menteeId: "mentee-1",
				startTime: futureDate.toISOString(),
				endTime: endDate.toISOString(),
				meetingLink: "https://zoom.us/j/123",
				paymentType: "COINS",
				paymentStatus: "PENDING",
				totalAmount: 100,
				currency: "USD",
			});

			expect(booking.mentorId).toBe("mentor-1");
			expect(booking.menteeId).toBe("mentee-1");
			expect(booking.paymentType).toBe("COINS");
		});

		it("should throw when mentor and mentee are same", () => {
			const futureDate = new Date();
			futureDate.setHours(futureDate.getHours() + 2);
			const endDate = new Date(futureDate);
			endDate.setHours(endDate.getHours() + 1);

			expect(() =>
				Booking.create({
					mentorId: "same-id",
					menteeId: "same-id",
					startTime: futureDate.toISOString(),
					endTime: endDate.toISOString(),
					meetingLink: "https://zoom.us/j/123",
					paymentType: "COINS",
					paymentStatus: "PENDING",
					totalAmount: 100,
					currency: "USD",
				}),
			).toThrow(EntityValidationError);
		});

		it("should throw when start time is after end time", () => {
			const futureDate = new Date();
			futureDate.setHours(futureDate.getHours() + 2);
			const endDate = new Date(futureDate);
			endDate.setHours(endDate.getHours() - 1);

			expect(() =>
				Booking.create({
					mentorId: "mentor-1",
					menteeId: "mentee-1",
					startTime: futureDate.toISOString(),
					endTime: endDate.toISOString(),
					meetingLink: "https://zoom.us/j/123",
					paymentType: "COINS",
					paymentStatus: "PENDING",
					totalAmount: 100,
					currency: "USD",
				}),
			).toThrow(EntityValidationError);
		});

		it("should throw when start time is in the past", () => {
			const pastDate = new Date();
			pastDate.setHours(pastDate.getHours() - 1);
			const endDate = new Date(pastDate);
			endDate.setHours(endDate.getHours() + 1);

			expect(() =>
				Booking.create({
					mentorId: "mentor-1",
					menteeId: "mentee-1",
					startTime: pastDate.toISOString(),
					endTime: endDate.toISOString(),
					meetingLink: "https://zoom.us/j/123",
					paymentType: "COINS",
					paymentStatus: "PENDING",
					totalAmount: 100,
					currency: "USD",
				}),
			).toThrow(EntityValidationError);
		});

		it("should throw with invalid date format", () => {
			expect(() =>
				Booking.create({
					mentorId: "mentor-1",
					menteeId: "mentee-1",
					startTime: "invalid-date",
					endTime: "invalid-date",
					meetingLink: "https://zoom.us/j/123",
					paymentType: "COINS",
					paymentStatus: "PENDING",
					totalAmount: 100,
					currency: "USD",
				}),
			).toThrow(EntityValidationError);
		});

		it("should create booking with notes", () => {
			const futureDate = new Date();
			futureDate.setHours(futureDate.getHours() + 2);
			const endDate = new Date(futureDate);
			endDate.setHours(endDate.getHours() + 1);

			const booking = Booking.create({
				mentorId: "mentor-1",
				menteeId: "mentee-1",
				startTime: futureDate.toISOString(),
				endTime: endDate.toISOString(),
				meetingLink: "https://zoom.us/j/123",
				paymentType: "STRIPE",
				paymentStatus: "COMPLETED",
				totalAmount: 200,
				currency: "USD",
				notes: "Discuss career guidance",
			});

			expect(booking.notes).toBe("Discuss career guidance");
		});
	});

	describe("assertCanBook", () => {
		it("should throw when booker is same as mentor", () => {
			expect(() => Booking.assertCanBook("user-1", "user-1")).toThrow(
				EntityValidationError,
			);
		});

		it("should allow booking when booker and mentor are different", () => {
			expect(() => Booking.assertCanBook("mentee-1", "mentor-1")).not.toThrow();
		});
	});

	describe("assertCancellable", () => {
		it("should allow cancellation for PENDING booking", () => {
			expect(() => Booking.assertCancellable("PENDING")).not.toThrow();
		});

		it("should allow cancellation for CONFIRMED booking", () => {
			expect(() => Booking.assertCancellable("CONFIRMED")).not.toThrow();
		});

		it("should throw for COMPLETED booking", () => {
			expect(() =>
				Booking.assertCancellable("COMPLETED" as BookingStatus),
			).toThrow(EntityValidationError);
		});

		it("should throw for STARTED booking", () => {
			expect(() =>
				Booking.assertCancellable("STARTED" as BookingStatus),
			).toThrow(EntityValidationError);
		});

		it("should throw for CANCELLED_BY_MENTOR booking", () => {
			expect(() =>
				Booking.assertCancellable("CANCELLED_BY_MENTOR" as BookingStatus),
			).toThrow(EntityValidationError);
		});

		it("should throw for CANCELLED_BY_MENTEE booking", () => {
			expect(() =>
				Booking.assertCancellable("CANCELLED_BY_MENTEE" as BookingStatus),
			).toThrow(EntityValidationError);
		});
	});

	describe("assertReschedulable", () => {
		it("should allow rescheduling when outside window", () => {
			const futureDate = new Date();
			futureDate.setHours(futureDate.getHours() + 10);

			const now = new Date();
			const booking = new Booking(
				"booking-1",
				"mentor-1",
				"mentor-user-1",
				"mentee-1",
				futureDate.toISOString(),
				new Date(futureDate.getTime() + 3600000).toISOString(),
				"CONFIRMED",
				"https://zoom.us/j/123",
				"COINS",
				"COMPLETED",
				100,
				"USD",
				null,
				"Mentee Name",
				"Mentor Name",
				now,
				null,
				null,
				now,
				now,
			);

			expect(() => booking.assertReschedulable(4)).not.toThrow();
		});

		it("should throw when within reschedule window", () => {
			const futureDate = new Date();
			futureDate.setHours(futureDate.getHours() + 2);

			const now = new Date();
			const booking = new Booking(
				"booking-1",
				"mentor-1",
				"mentor-user-1",
				"mentee-1",
				futureDate.toISOString(),
				new Date(futureDate.getTime() + 3600000).toISOString(),
				"CONFIRMED",
				"https://zoom.us/j/123",
				"COINS",
				"COMPLETED",
				100,
				"USD",
				null,
				"Mentee Name",
				"Mentor Name",
				now,
				null,
				null,
				now,
				now,
			);

			expect(() => booking.assertReschedulable(4)).toThrow(
				EntityValidationError,
			);
		});

		it("should allow rescheduling well outside window", () => {
			const futureDate = new Date();
			futureDate.setHours(futureDate.getHours() + 10);

			const now = new Date();
			const booking = new Booking(
				"booking-1",
				"mentor-1",
				"mentor-user-1",
				"mentee-1",
				futureDate.toISOString(),
				new Date(futureDate.getTime() + 3600000).toISOString(),
				"CONFIRMED",
				"https://zoom.us/j/123",
				"COINS",
				"COMPLETED",
				100,
				"USD",
				null,
				"Mentee Name",
				"Mentor Name",
				now,
				null,
				null,
				now,
				now,
			);

			expect(() => booking.assertReschedulable(4)).not.toThrow();
		});
	});
});
