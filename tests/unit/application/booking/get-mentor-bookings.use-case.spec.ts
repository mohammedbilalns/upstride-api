import { beforeEach, describe, expect, it } from "vitest";
import { GetMentorBookingsUseCase } from "../../../../src/application/modules/booking/use-cases/get-mentor-bookings.use-case";
import { MentorNotFoundError } from "../../../../src/application/shared/errors/mentor-not-found.error";
import type { IBookingRepository } from "../../../../src/domain/repositories/booking.repository.interface";
import type { IMentorWriteRepository } from "../../../../src/domain/repositories/mentor-write.repository.interface";
import type { IReviewRepository } from "../../../../src/domain/repositories/review.repository.interface";
import { createBooking } from "../../../factories/entities/booking.factory";
import { createMentor } from "../../../factories/entities/mentor.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetMentorBookingsUseCase", () => {
	let bookingRepository: ReturnType<typeof createMock<IBookingRepository>>;
	let mentorRepository: ReturnType<typeof createMock<IMentorWriteRepository>>;
	let reviewRepository: ReturnType<typeof createMock<IReviewRepository>>;
	let useCase: GetMentorBookingsUseCase;

	beforeEach(() => {
		bookingRepository = createMock<IBookingRepository>();
		mentorRepository = createMock<IMentorWriteRepository>();
		reviewRepository = createMock<IReviewRepository>();
		useCase = new GetMentorBookingsUseCase(
			bookingRepository,
			mentorRepository,
			reviewRepository,
		);
	});

	it("should throw when the mentor is not found", async () => {
		mentorRepository.findByUserId.mockResolvedValue(null);

		await expect(useCase.execute({ userId: "user-1" })).rejects.toBeInstanceOf(
			MentorNotFoundError,
		);
	});

	it("should paginate mentor bookings using the mentor id", async () => {
		mentorRepository.findByUserId.mockResolvedValue(createMentor());
		bookingRepository.paginateByMentor.mockResolvedValue({
			items: [createBooking({ mentorId: "mentor-1" })],
			total: 1,
			page: 2,
			limit: 5,
			totalPages: 1,
		});
		reviewRepository.findByBookingIds.mockResolvedValue([]);

		const result = await useCase.execute({
			userId: "user-1",
			filter: "upcoming",
			page: 2,
			limit: 5,
		});

		expect(bookingRepository.paginateByMentor).toHaveBeenCalledWith(
			"mentor-1",
			"upcoming",
			2,
			5,
		);
		expect(result.items).toHaveLength(1);
	});
});
