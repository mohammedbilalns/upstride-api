import { beforeEach, describe, expect, it } from "vitest";
import { GetUserBookingsUseCase } from "../../../../../src/application/modules/booking/use-cases/get-user-bookings.use-case";
import type { IBookingRepository } from "../../../../../src/domain/repositories/booking.repository.interface";
import type { IReviewRepository } from "../../../../../src/domain/repositories/review.repository.interface";
import { createBooking } from "../../../../factories/entities/booking.factory";
import { createReview } from "../../../../factories/entities/review.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetUserBookingsUseCase", () => {
	let bookingRepository: ReturnType<typeof createMock<IBookingRepository>>;
	let reviewRepository: ReturnType<typeof createMock<IReviewRepository>>;
	let useCase: GetUserBookingsUseCase;

	beforeEach(() => {
		bookingRepository = createMock<IBookingRepository>();
		reviewRepository = createMock<IReviewRepository>();
		useCase = new GetUserBookingsUseCase(bookingRepository, reviewRepository);
	});

	it("should paginate mentee bookings with default filter and pagination", async () => {
		bookingRepository.paginateByMentee.mockResolvedValue({
			items: [
				createBooking({ id: "booking-1", meetingLink: "Pending" }),
				createBooking({ id: "booking-2" }),
			],
			total: 2,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		reviewRepository.findByBookingIds.mockResolvedValue([
			createReview({ bookingId: "booking-1" }),
		]);

		const result = await useCase.execute({ userId: "user-1" });

		expect(bookingRepository.paginateByMentee).toHaveBeenCalledWith(
			"user-1",
			"all",
			1,
			10,
		);
		expect(bookingRepository.updateById).toHaveBeenCalledWith("booking-1", {
			meetingLink: "http://localhost:5173/sessions/booking-1",
		});
		expect(result.items[0].review).toEqual(
			expect.objectContaining({ bookingId: "booking-1" }),
		);
	});
});
