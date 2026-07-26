import { beforeEach, describe, expect, it } from "vitest";
import { checkBookingConflict } from "../../../../../src/application/modules/booking/utils/check-booking-conflict.util";
import type { IBookingRepository } from "../../../../../src/domain/repositories/booking.repository.interface";
import type { MentorProfileDetails } from "../../../../../src/domain/repositories/mentor.repository.types";
import type { IMentorProfileReadRepository } from "../../../../../src/domain/repositories/mentor-profile-read.repository.interface";
import { createBooking } from "../../../../factories/entities/booking.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("check-booking-conflict.util", () => {
	describe("checkBookingConflict", () => {
		let bookingRepository: ReturnType<typeof createMock<IBookingRepository>>;
		let mentorRepository: ReturnType<
			typeof createMock<IMentorProfileReadRepository>
		>;
		const startTime = new Date("2025-06-01T10:00:00.000Z");
		const endTime = new Date("2025-06-01T11:00:00.000Z");

		beforeEach(() => {
			bookingRepository = createMock<IBookingRepository>();
			mentorRepository = createMock<IMentorProfileReadRepository>();
		});

		const mentorProfile = {
			id: "mentor-1",
		} as MentorProfileDetails;

		it("should return false when there are no overlapping bookings", async () => {
			mentorRepository.findProfileByUserId.mockResolvedValue(null);
			bookingRepository.findOverlappingForUser.mockResolvedValue([]);

			const result = await checkBookingConflict(
				"user-1",
				startTime,
				endTime,
				bookingRepository,
				mentorRepository,
			);

			expect(result).toBe(false);
		});

		it("should return true when a completed booking conflicts", async () => {
			mentorRepository.findProfileByUserId.mockResolvedValue(null);
			bookingRepository.findOverlappingForUser.mockResolvedValue([
				createBooking({
					id: "conflict-1",
					paymentStatus: "COMPLETED",
					menteeId: "other-user",
				}),
			]);

			const result = await checkBookingConflict(
				"user-1",
				startTime,
				endTime,
				bookingRepository,
				mentorRepository,
			);

			expect(result).toBe(true);
		});

		it("should return true when the user is the mentee of the overlapping booking", async () => {
			mentorRepository.findProfileByUserId.mockResolvedValue(null);
			bookingRepository.findOverlappingForUser.mockResolvedValue([
				createBooking({
					id: "conflict-1",
					menteeId: "user-1",
					paymentStatus: "PENDING",
				}),
			]);

			const result = await checkBookingConflict(
				"user-1",
				startTime,
				endTime,
				bookingRepository,
				mentorRepository,
			);

			expect(result).toBe(true);
		});

		it("should return true when the user is the mentor of the overlapping booking", async () => {
			mentorRepository.findProfileByUserId.mockResolvedValue(mentorProfile);
			bookingRepository.findOverlappingForUser.mockResolvedValue([
				createBooking({
					id: "conflict-1",
					mentorId: "mentor-1",
					paymentStatus: "PENDING",
				}),
			]);

			const result = await checkBookingConflict(
				"user-1",
				startTime,
				endTime,
				bookingRepository,
				mentorRepository,
			);

			expect(result).toBe(true);
		});

		it("should exclude the specified booking from conflict check", async () => {
			mentorRepository.findProfileByUserId.mockResolvedValue(null);
			bookingRepository.findOverlappingForUser.mockResolvedValue([
				createBooking({
					id: "booking-to-exclude",
					menteeId: "user-1",
					paymentStatus: "COMPLETED",
				}),
			]);

			const result = await checkBookingConflict(
				"user-1",
				startTime,
				endTime,
				bookingRepository,
				mentorRepository,
				"booking-to-exclude",
			);

			expect(result).toBe(false);
		});

		it("should pass mentorId as null when user is not a mentor", async () => {
			mentorRepository.findProfileByUserId.mockResolvedValue(null);
			bookingRepository.findOverlappingForUser.mockResolvedValue([]);

			await checkBookingConflict(
				"user-1",
				startTime,
				endTime,
				bookingRepository,
				mentorRepository,
			);

			expect(bookingRepository.findOverlappingForUser).toHaveBeenCalledWith(
				"user-1",
				null,
				startTime,
				endTime,
			);
		});

		it("should pass the mentorId when user has a mentor profile", async () => {
			mentorRepository.findProfileByUserId.mockResolvedValue(mentorProfile);
			bookingRepository.findOverlappingForUser.mockResolvedValue([]);

			await checkBookingConflict(
				"user-1",
				startTime,
				endTime,
				bookingRepository,
				mentorRepository,
			);

			expect(bookingRepository.findOverlappingForUser).toHaveBeenCalledWith(
				"user-1",
				"mentor-1",
				startTime,
				endTime,
			);
		});

		it("should return false when only excluded bookings conflict", async () => {
			mentorRepository.findProfileByUserId.mockResolvedValue(null);
			bookingRepository.findOverlappingForUser.mockResolvedValue([
				createBooking({
					id: "excluded-booking",
					menteeId: "user-1",
					paymentStatus: "COMPLETED",
				}),
			]);

			const result = await checkBookingConflict(
				"user-1",
				startTime,
				endTime,
				bookingRepository,
				mentorRepository,
				"excluded-booking",
			);

			expect(result).toBe(false);
		});
	});
});
