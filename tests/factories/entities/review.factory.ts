import { Review } from "../../../src/domain/entities/review.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createReview(overrides: Partial<Review> = {}): Review {
	const data = mergeDefaults<Review>(
		{
			id: "review-1",
			mentorId: "mentor-1",
			userId: "user-1",
			bookingId: "booking-1",
			rating: 5,
			comment: "Excellent session!",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new Review(
		data.id,
		data.mentorId,
		data.userId,
		data.bookingId,
		data.rating,
		data.comment,
		data.createdAt,
		data.updatedAt,
	);
}
