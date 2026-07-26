import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../../../../../src/application/modules/authentication/errors";
import { BookingNotFoundError } from "../../../../../src/application/modules/booking/errors/booking.errors";
import { CreateReviewUseCase } from "../../../../../src/application/modules/review/use-cases/create-review.use-case";
import type { IIdGenerator } from "../../../../../src/application/services/id-generator.service.interface";
import { ConflictError } from "../../../../../src/application/shared/errors/conflict-error";
import { ValidationError } from "../../../../../src/application/shared/errors/validation-error";
import type { IBookingRepository } from "../../../../../src/domain/repositories/booking.repository.interface";
import type { IMentorWriteRepository } from "../../../../../src/domain/repositories/mentor-write.repository.interface";
import type { IReviewRepository } from "../../../../../src/domain/repositories/review.repository.interface";
import { createBooking } from "../../../../factories/entities/booking.factory";
import { createMentor } from "../../../../factories/entities/mentor.factory";
import { createReview } from "../../../../factories/entities/review.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("CreateReviewUseCase", () => {
	let bookingRepository: ReturnType<typeof createMock<IBookingRepository>>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let reviewRepository: ReturnType<typeof createMock<IReviewRepository>>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let useCase: CreateReviewUseCase;

	const baseInput = {
		userId: "user-1",
		bookingId: "booking-1",
		rating: 5,
		comment: "Very helpful session",
	};

	beforeEach(() => {
		bookingRepository = createMock<IBookingRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		reviewRepository = createMock<IReviewRepository>();
		idGenerator = createMock<IIdGenerator>();
		useCase = new CreateReviewUseCase(
			bookingRepository,
			mentorRepository,
			reviewRepository,
			idGenerator,
		);

		idGenerator.generate.mockReturnValue("review-1");
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-24T00:00:00.000Z"));
	});

	it("should throw when the booking does not exist", async () => {
		bookingRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			BookingNotFoundError,
		);
	});

	it("should throw when the booking does not belong to the requester", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({ menteeId: "other-user" }),
		);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			UnauthorizedError,
		);
	});

	it("should throw when the session is in the future", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({ endTime: "2026-08-01T11:00:00.000Z" }),
		);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ValidationError,
		);
	});

	it("should throw when a review already exists", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({
				endTime: "2026-07-20T11:00:00.000Z",
				status: "COMPLETED",
				settledAt: new Date("2026-07-20T12:00:00.000Z"),
			}),
		);
		reviewRepository.findByBookingId.mockResolvedValue(createReview());

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ConflictError,
		);
	});

	it("should create the review and update mentor average rating", async () => {
		bookingRepository.findById.mockResolvedValue(
			createBooking({
				endTime: "2026-07-20T11:00:00.000Z",
				status: "COMPLETED",
				settledAt: new Date("2026-07-20T12:00:00.000Z"),
			}),
		);
		reviewRepository.findByBookingId.mockResolvedValue(null);
		reviewRepository.create.mockResolvedValue(
			createReview({ id: "review-1", comment: baseInput.comment }),
		);
		reviewRepository.getStatsByMentorId.mockResolvedValue({
			count: 3,
			averageRating: 4.6666,
		});
		mentorRepository.findById.mockResolvedValue(createMentor());

		const result = await useCase.execute(baseInput);

		expect(reviewRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "review-1",
				bookingId: "booking-1",
				rating: 5,
			}),
		);
		expect(mentorRepository.updateById).toHaveBeenCalledWith("mentor-1", {
			avgRating: 4.67,
		});
		expect(result.review.comment).toBe(baseInput.comment);
	});
});
