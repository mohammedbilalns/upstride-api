import { beforeEach, describe, expect, it } from "vitest";
import { BookingNotFoundError } from "../../../../src/application/modules/booking/errors/booking.errors";
import { GetBookingDetailsUseCase } from "../../../../src/application/modules/booking/use-cases/get-booking-details.use-case";
import type { IBookingRepository } from "../../../../src/domain/repositories/booking.repository.interface";
import type { IReviewRepository } from "../../../../src/domain/repositories/review.repository.interface";
import { createBooking } from "../../../factories/entities/booking.factory";
import { createReview } from "../../../factories/entities/review.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetBookingDetailsUseCase", () => {
	let bookingRepository: ReturnType<typeof createMock<IBookingRepository>>;
	let reviewRepository: ReturnType<typeof createMock<IReviewRepository>>;
	let useCase: GetBookingDetailsUseCase;

	beforeEach(() => {
		bookingRepository = createMock<IBookingRepository>();
		reviewRepository = createMock<IReviewRepository>();
		useCase = new GetBookingDetailsUseCase(bookingRepository, reviewRepository);
	});

	it("should throw when the booking is not accessible to the user", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({ menteeId: "other-user", mentorUserId: "mentor-2" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", bookingId: "booking-1" }),
		).rejects.toBeInstanceOf(BookingNotFoundError);
	});

	it("should generate and persist a meeting link for completed bookings", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({
				id: "booking-1",
				menteeId: "user-1",
				meetingLink: "Pending",
				paymentStatus: "COMPLETED",
			}),
		);
		reviewRepository.findByBookingId.mockResolvedValue(null);

		const result = await useCase.execute({
			userId: "user-1",
			bookingId: "booking-1",
		});

		expect(bookingRepository.updateById).toHaveBeenCalledWith("booking-1", {
			meetingLink: "http://localhost:5173/call/booking-1",
		});
		expect(result.booking.meetingLink).toBe(
			"http://localhost:5173/call/booking-1",
		);
	});

	it("should include the mapped review when present", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({ menteeId: "user-1" }),
		);
		reviewRepository.findByBookingId.mockResolvedValue(createReview());

		const result = await useCase.execute({
			userId: "user-1",
			bookingId: "booking-1",
		});

		expect(result.booking.review).toEqual(
			expect.objectContaining({
				id: "review-1",
				bookingId: "booking-1",
				rating: 5,
			}),
		);
	});
});
