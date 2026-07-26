import { beforeEach, describe, expect, it } from "vitest";
import { GetMentorReviewsUseCase } from "../../../../../src/application/modules/review/use-cases/get-mentor-reviews.use-case";
import { NotFoundError } from "../../../../../src/application/shared/errors/not-found-error";
import type { IMentorProfileReadRepository } from "../../../../../src/domain/repositories/mentor-profile-read.repository.interface";
import type { IReviewRepository } from "../../../../../src/domain/repositories/review.repository.interface";
import { createMentor } from "../../../../factories/entities/mentor.factory";
import { createReview } from "../../../../factories/entities/review.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetMentorReviewsUseCase", () => {
	let mentorProfileRepository: ReturnType<
		typeof createMock<IMentorProfileReadRepository>
	>;
	let reviewRepository: ReturnType<typeof createMock<IReviewRepository>>;
	let useCase: GetMentorReviewsUseCase;

	beforeEach(() => {
		mentorProfileRepository = createMock<IMentorProfileReadRepository>();
		reviewRepository = createMock<IReviewRepository>();
		useCase = new GetMentorReviewsUseCase(
			mentorProfileRepository,
			reviewRepository,
		);
	});

	it("should throw when the mentor does not exist", async () => {
		mentorProfileRepository.findProfileById.mockResolvedValue(null);

		await expect(
			useCase.execute({ mentorId: "mentor-1" }),
		).rejects.toBeInstanceOf(NotFoundError);
	});

	it("should paginate reviews with a fixed page size", async () => {
		mentorProfileRepository.findProfileById.mockResolvedValue({
			...createMentor(),
			user: { name: "Mentor", email: "mentor@example.com" },
			currentRoleDetails: { id: "role-1", name: "Engineer" },
			expertisesDetails: [],
			skillsDetails: [],
		});
		reviewRepository.paginateByMentorId.mockResolvedValue({
			items: [{ ...createReview(), reviewerName: "User One" }],
			total: 1,
			page: 2,
			limit: 5,
			totalPages: 1,
		});

		const result = await useCase.execute({ mentorId: "mentor-1", page: 2 });

		expect(reviewRepository.paginateByMentorId).toHaveBeenCalledWith(
			"mentor-1",
			2,
			5,
		);
		expect(result.reviews).toHaveLength(1);
	});
});
