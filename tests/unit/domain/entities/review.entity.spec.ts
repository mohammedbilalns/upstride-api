import { describe, expect, it } from "vitest";
import { Review } from "../../../../src/domain/entities/review.entity";
import { EntityValidationError } from "../../../../src/domain/errors";

describe("Review Entity", () => {
	describe("create", () => {
		it("should create valid review", () => {
			const result = Review.create(
				"mentor-1",
				"user-1",
				"booking-1",
				5,
				"Excellent mentorship experience!",
			);

			expect(result.mentorId).toBe("mentor-1");
			expect(result.userId).toBe("user-1");
			expect(result.bookingId).toBe("booking-1");
			expect(result.rating).toBe(5);
			expect(result.comment).toBe("Excellent mentorship experience!");
		});

		it("should throw when rating is below 1", () => {
			expect(() =>
				Review.create("mentor-1", "user-1", "booking-1", 0, "Comment"),
			).toThrow(EntityValidationError);
		});

		it("should throw when rating is above 5", () => {
			expect(() =>
				Review.create("mentor-1", "user-1", "booking-1", 6, "Comment"),
			).toThrow(EntityValidationError);
		});

		it("should allow rating of 1", () => {
			const result = Review.create(
				"mentor-1",
				"user-1",
				"booking-1",
				1,
				"Poor experience",
			);

			expect(result.rating).toBe(1);
		});

		it("should allow rating of 3", () => {
			const result = Review.create(
				"mentor-1",
				"user-1",
				"booking-1",
				3,
				"Average experience",
			);

			expect(result.rating).toBe(3);
		});

		it("should allow rating of 5", () => {
			const result = Review.create(
				"mentor-1",
				"user-1",
				"booking-1",
				5,
				"Great experience",
			);

			expect(result.rating).toBe(5);
		});

		it("should throw when comment is empty", () => {
			expect(() =>
				Review.create("mentor-1", "user-1", "booking-1", 5, ""),
			).toThrow(EntityValidationError);
		});

		it("should throw when comment is only whitespace", () => {
			expect(() =>
				Review.create("mentor-1", "user-1", "booking-1", 5, "   \t\n  "),
			).toThrow(EntityValidationError);
		});

		it("should allow long comments", () => {
			const longComment =
				"This was an excellent experience. The mentor was very helpful and provided great insights. I learned a lot and would definitely recommend this mentorship program to others.";

			const result = Review.create(
				"mentor-1",
				"user-1",
				"booking-1",
				5,
				longComment,
			);

			expect(result.comment).toBe(longComment);
		});

		it("should allow short comments", () => {
			const result = Review.create(
				"mentor-1",
				"user-1",
				"booking-1",
				4,
				"Good",
			);

			expect(result.comment).toBe("Good");
		});

		it("should preserve comment with special characters", () => {
			const comment = "Awesome! 🎉 @mentor provided great insights.";

			const result = Review.create(
				"mentor-1",
				"user-1",
				"booking-1",
				5,
				comment,
			);

			expect(result.comment).toBe(comment);
		});
	});

	describe("constructor", () => {
		it("should create review instance with all properties", () => {
			const now = new Date();
			const updatedAt = new Date();

			const review = new Review(
				"review-1",
				"mentor-1",
				"user-1",
				"booking-1",
				4,
				"Great session",
				now,
				updatedAt,
			);

			expect(review.id).toBe("review-1");
			expect(review.mentorId).toBe("mentor-1");
			expect(review.userId).toBe("user-1");
			expect(review.bookingId).toBe("booking-1");
			expect(review.rating).toBe(4);
			expect(review.comment).toBe("Great session");
			expect(review.createdAt).toEqual(now);
			expect(review.updatedAt).toEqual(updatedAt);
		});
	});
});
