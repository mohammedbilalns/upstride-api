import { beforeEach, describe, expect, it } from "vitest";
import {
	BookingAlreadyCancelledError,
	BookingNotFoundError,
	UnauthorizedBookingActionError,
} from "../../../../../src/application/modules/booking/errors/booking.errors";
import { CancelBookingUseCase } from "../../../../../src/application/modules/booking/use-cases/cancel-booking.use-case";
import type { IRefundSessionAmountUseCase } from "../../../../../src/application/modules/booking/use-cases/refund-session-amount.use-case.interface";
import type { ICreateNotificationUseCase } from "../../../../../src/application/modules/notification/use-cases/create-notification.use-case.interface";
import { ValidationError } from "../../../../../src/application/shared/errors";
import { EntityValidationError } from "../../../../../src/domain/errors";
import type { IBookingRepository } from "../../../../../src/domain/repositories/booking.repository.interface";
import { createBooking } from "../../../../factories/entities/booking.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("CancelBookingUseCase", () => {
	let bookingRepository: ReturnType<typeof createMock<IBookingRepository>>;
	let refundSessionAmountUseCase: ReturnType<
		typeof createMock<IRefundSessionAmountUseCase>
	>;
	let createNotificationUseCase: ReturnType<
		typeof createMock<ICreateNotificationUseCase>
	>;
	let useCase: CancelBookingUseCase;

	beforeEach(() => {
		bookingRepository = createMock<IBookingRepository>();
		refundSessionAmountUseCase = createMock<IRefundSessionAmountUseCase>();
		createNotificationUseCase = createMock<ICreateNotificationUseCase>();
		useCase = new CancelBookingUseCase(
			bookingRepository,
			refundSessionAmountUseCase,
			createNotificationUseCase,
		);
	});

	it("should throw when the booking does not exist", async () => {
		bookingRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(BookingNotFoundError);
	});

	it("should throw when the user is not the mentee", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({ menteeId: "other-user" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(UnauthorizedBookingActionError);
	});

	it("should reject already-cancelled bookings", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({ status: "CANCELLED_BY_MENTEE" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(BookingAlreadyCancelledError);
	});

	it("should reject pending payments", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({ paymentStatus: "PENDING", status: "PENDING" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(ValidationError);
	});

	it("should reject non-cancellable statuses", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({ status: "STARTED" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(EntityValidationError);
	});

	it("should cancel the booking, refund, and notify the mentor", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({
				id: "booking-1",
				menteeId: "user-1",
				mentorUserId: "mentor-user-1",
				notes: "Existing note",
			}),
		);
		refundSessionAmountUseCase.execute.mockResolvedValue({
			refund: {
				amount: 500,
				percentage: 50,
				currency: "COINS",
				reason: "Policy",
			},
		});

		const result = await useCase.execute({
			userId: "user-1",
			bookingId: "booking-1",
			reason: "Need to reschedule",
		});

		expect(bookingRepository.updateById).toHaveBeenCalledWith("booking-1", {
			status: "CANCELLED_BY_MENTEE",
			notes: "Existing note\nCancellation Reason: Need to reschedule",
		});
		expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "mentor-user-1",
				relatedEntityId: "booking-1",
				event: "SESSION_CANCELLED",
				metadata: expect.objectContaining({
					refundAmount: 500,
					cancellationReason: "Need to reschedule",
				}),
			}),
		);
		expect(result).toEqual({
			bookingId: "booking-1",
			status: "CANCELLED_BY_MENTEE",
			refund: {
				amount: 500,
				percentage: 50,
				currency: "COINS",
				reason: "Policy",
			},
		});
	});
});
