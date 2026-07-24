import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidDateError } from "../../../../src/application/modules/booking/errors/booking.errors";
import { GetAvailableSlotsUseCase } from "../../../../src/application/modules/booking/use-cases/get-available-slots.use-case";
import { NotFoundError } from "../../../../src/application/shared/errors/not-found-error";
import type { IAvailabilityRepository } from "../../../../src/domain/repositories/availability.repository.interface";
import type { IBookingRepository } from "../../../../src/domain/repositories/booking.repository.interface";
import type { IMentorProfileReadRepository } from "../../../../src/domain/repositories/mentor-profile-read.repository.interface";
import { createAvailability } from "../../../factories/entities/availability.factory";
import { createBooking } from "../../../factories/entities/booking.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetAvailableSlotsUseCase", () => {
	let availabilityRepository: ReturnType<
		typeof createMock<IAvailabilityRepository>
	>;
	let bookingRepository: ReturnType<typeof createMock<IBookingRepository>>;
	let mentorProfileRepository: ReturnType<
		typeof createMock<IMentorProfileReadRepository>
	>;
	let useCase: GetAvailableSlotsUseCase;

	beforeEach(() => {
		availabilityRepository = createMock<IAvailabilityRepository>();
		bookingRepository = createMock<IBookingRepository>();
		mentorProfileRepository = createMock<IMentorProfileReadRepository>();
		useCase = new GetAvailableSlotsUseCase(
			availabilityRepository,
			bookingRepository,
			mentorProfileRepository,
		);
		vi.spyOn(Date, "now").mockReturnValue(
			new Date("2026-07-20T00:00:00.000Z").getTime(),
		);
	});

	it("should throw for an invalid date", async () => {
		await expect(
			useCase.execute({
				mentorId: "mentor-1",
				requesterUserId: "user-1",
				date: new Date("invalid"),
			}),
		).rejects.toBeInstanceOf(InvalidDateError);
	});

	it("should return empty slots when the mentor has no availabilities", async () => {
		availabilityRepository.findActiveByMentorIdAndDate.mockResolvedValue([]);

		const result = await useCase.execute({
			mentorId: "mentor-1",
			requesterUserId: "user-1",
			date: new Date("2026-08-01T00:00:00.000Z"),
		});

		expect(result).toEqual({ slots: [] });
		expect(bookingRepository.findByMentorIdAndDate).not.toHaveBeenCalled();
	});

	it("should throw when the mentor profile is not found", async () => {
		availabilityRepository.findActiveByMentorIdAndDate.mockResolvedValue([
			createAvailability({
				startDate: "2026-08-01",
				endDate: "2026-12-31",
				days: new Set(["Saturday"]),
				startTime: "09:00",
				endTime: "11:00",
				slotDuration: 60,
				bufferTime: 10,
				breakTimes: [],
			}),
		]);
		bookingRepository.findByMentorIdAndDate.mockResolvedValue([]);
		mentorProfileRepository.findProfileById.mockResolvedValue(null);

		await expect(
			useCase.execute({
				mentorId: "mentor-1",
				requesterUserId: "user-1",
				date: new Date("2026-08-01T00:00:00.000Z"),
			}),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it("should return priced slots and preserve requester pending bookings", async () => {
		availabilityRepository.findActiveByMentorIdAndDate.mockResolvedValue([
			createAvailability({
				startDate: "2026-08-01",
				endDate: "2026-12-31",
				days: new Set(["Saturday"]),
				startTime: "09:00",
				endTime: "12:00",
				slotDuration: 60,
				bufferTime: 0,
				breakTimes: [],
			}),
		]);
		bookingRepository.findByMentorIdAndDate.mockResolvedValue([
			createBooking({
				id: "booking-pending",
				menteeId: "user-1",
				startTime: "2026-08-01T04:30:00.000Z",
				endTime: "2026-08-01T05:30:00.000Z",
				paymentStatus: "PENDING",
				status: "PENDING",
			}),
			createBooking({
				id: "booking-confirmed",
				menteeId: "user-2",
				startTime: "2026-08-01T06:30:00.000Z",
				endTime: "2026-08-01T07:30:00.000Z",
				paymentStatus: "COMPLETED",
				status: "CONFIRMED",
			}),
		]);
		mentorProfileRepository.findProfileById.mockResolvedValue({
			...createMentor(),
			user: { name: "Mentor", email: "mentor@example.com" },
			currentRoleDetails: { id: "role-1", name: "Engineer" },
			expertisesDetails: [],
			skillsDetails: [],
		});

		const result = await useCase.execute({
			mentorId: "mentor-1",
			requesterUserId: "user-1",
			date: new Date("2026-08-01T00:00:00.000Z"),
		});

		expect(result.slots).toEqual([
			expect.objectContaining({
				startTime: "2026-08-01T03:30:00.000Z",
				endTime: "2026-08-01T04:30:00.000Z",
				durationMinutes: 60,
				price: 4000,
				status: "AVAILABLE",
			}),
			expect.objectContaining({
				startTime: "2026-08-01T04:30:00.000Z",
				endTime: "2026-08-01T05:30:00.000Z",
				status: "BOOKED_PENDING",
				bookingId: "booking-pending",
				bookingPaymentStatus: "PENDING",
			}),
			expect.objectContaining({
				startTime: "2026-08-01T05:30:00.000Z",
				endTime: "2026-08-01T06:30:00.000Z",
				durationMinutes: 60,
				price: 4000,
				status: "AVAILABLE",
			}),
		]);
	});
});
