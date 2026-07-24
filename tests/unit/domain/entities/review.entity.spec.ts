import { describe, expect, it } from "vitest";
import { Review } from "../../../../src/domain/entities/review.entity";
import { EntityValidationError } from "../../../../src/domain/errors/entity-validation.error";

describe("Review Entity", () => {
	describe("create static method", () => {
		it("should throw when rating below 1", () => {
			expect(() => Review.create("m1", "u1", "b1", 0, "Comment")).toThrow(
				EntityValidationError,
			);
		});

		it("should throw when rating above 5", () => {
			expect(() => Review.create("m1", "u1", "b1", 6, "Comment")).toThrow(
				EntityValidationError,
			);
		});

		it("should throw when comment empty", () => {
			expect(() => Review.create("m1", "u1", "b1", 5, "")).toThrow(
				EntityValidationError,
			);
		});

		it("should throw when comment only whitespace", () => {
			expect(() => Review.create("m1", "u1", "b1", 5, "   ")).toThrow(
				EntityValidationError,
			);
		});

		it("should create valid review with rating 1", () => {
			const review = Review.create("m1", "u1", "b1", 1, "Poor");
			expect(review.rating).toBe(1);
		});

		it("should create valid review with rating 5", () => {
			const review = Review.create("m1", "u1", "b1", 5, "Excellent");
			expect(review.rating).toBe(5);
		});

		it("should preserve comment text", () => {
			const review = Review.create("m1", "u1", "b1", 4, "Good session");
			expect(review.comment).toBe("Good session");
		});
	});

	describe("constructor", () => {
		it("should create review", () => {
			const now = new Date();
			const review = new Review("r1", "m1", "u1", "b1", 5, "Text", now, now);

			expect(review.id).toBe("r1");
			expect(review.mentorId).toBe("m1");
			expect(review.userId).toBe("u1");
			expect(review.bookingId).toBe("b1");
			expect(review.rating).toBe(5);
			expect(review.comment).toBe("Text");
		});
	});
});
