import { beforeEach, describe, expect, it } from "vitest";
import {
	BookingAlreadyCancelledError,
	BookingNotFoundError,
	UnauthorizedBookingActionError,
} from "../../../../src/application/modules/booking/errors/booking.errors";
import { CancelBookingByMentorUseCase } from "../../../../src/application/modules/booking/use-cases/cancel-booking-by-mentor.use-case";
import type { IRefundSessionAmountUseCase } from "../../../../src/application/modules/booking/use-cases/refund-session-amount.use-case.interface";
import type { ICreateNotificationUseCase } from "../../../../src/application/modules/notification/use-cases/create-notification.use-case.interface";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import { EntityValidationError } from "../../../../src/domain/errors";
import type { IBookingRepository } from "../../../../src/domain/repositories/booking.repository.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import { createBooking } from "../../../factories/entities/booking.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("CancelBookingByMentorUseCase", () => {
	let bookingRepository: ReturnType<typeof createMock<IBookingRepository>>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let refundSessionAmountUseCase: ReturnType<
		typeof createMock<IRefundSessionAmountUseCase>
	>;
	let createNotificationUseCase: ReturnType<
		typeof createMock<ICreateNotificationUseCase>
	>;
	let useCase: CancelBookingByMentorUseCase;

	beforeEach(() => {
		bookingRepository = createMock<IBookingRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		refundSessionAmountUseCase = createMock<IRefundSessionAmountUseCase>();
		createNotificationUseCase = createMock<ICreateNotificationUseCase>();
		useCase = new CancelBookingByMentorUseCase(
			bookingRepository,
			mentorRepository,
			refundSessionAmountUseCase,
			createNotificationUseCase,
		);
	});

	it("should throw when the mentor is not found", async () => {
		mentorRepository.findByUserId.mockResolvedValue(null);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(MentorNotFoundError);
	});

	it("should throw when the booking does not exist", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		bookingRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(BookingNotFoundError);
	});

	it("should reject bookings owned by another mentor", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		bookingRepository.findById.mockResolvedValue(
			createBooking({ mentorId: "mentor-2" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(UnauthorizedBookingActionError);
	});

	it("should reject already-cancelled bookings", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		bookingRepository.findById.mockResolvedValue(
			createBooking({ status: "CANCELLED_BY_MENTOR" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(BookingAlreadyCancelledError);
	});

	it("should reject non-cancellable statuses", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		bookingRepository.findById.mockResolvedValue(
			createBooking({ status: "COMPLETED" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(EntityValidationError);
	});

	it("should cancel the booking, refund, and notify the mentee", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		bookingRepository.findById.mockResolvedValue(
			createBooking({
				id: "booking-1",
				mentorId: "mentor-1",
				menteeId: "user-1",
				notes: null,
			}),
		);
		refundSessionAmountUseCase.execute.mockResolvedValue({
			refund: {
				amount: 1000,
				percentage: 100,
				currency: "COINS",
				reason: "Mentor cancelled",
			},
		});

		const result = await useCase.execute({
			userId: "user-1",
			bookingId: "booking-1",
			reason: "Unavailable",
		});

		expect(bookingRepository.updateById).toHaveBeenCalledWith("booking-1", {
			status: "CANCELLED_BY_MENTOR",
			notes: "Cancellation Reason: Unavailable",
		});
		expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				actorId: "user-1",
				event: "SESSION_CANCELLED",
				metadata: expect.objectContaining({
					cancelledBy: "mentor",
					refundAmount: 1000,
				}),
			}),
		);
		expect(result.status).toBe("CANCELLED_BY_MENTOR");
	});
});
