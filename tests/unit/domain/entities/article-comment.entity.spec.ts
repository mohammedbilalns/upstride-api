import { describe, expect, it } from "vitest";
import { ArticleComment } from "../../../../src/domain/entities/article-comment.entity";

describe("ArticleComment Entity Additional Behavior", () => {
	it("should increment likes", () => {
		const now = new Date();
		const comment = new ArticleComment(
			"comment-1",
			"article-1",
			null,
			"user-1",
			5,
			0,
			"Great article",
			true,
			now,
			now,
		);

		const result = comment.incrementLikes();
		expect(result.likesCount).toBe(6);
	});

	it("should decrement likes", () => {
		const now = new Date();
		const comment = new ArticleComment(
			"comment-1",
			"article-1",
			null,
			"user-1",
			5,
			0,
			"Great article",
			true,
			now,
			now,
		);

		const result = comment.decrementLikes();
		expect(result.likesCount).toBe(4);
	});

	it("should not go below zero on decrement", () => {
		const now = new Date();
		const comment = new ArticleComment(
			"comment-1",
			"article-1",
			null,
			"user-1",
			0,
			0,
			"Great article",
			true,
			now,
			now,
		);

		const result = comment.decrementLikes();
		expect(result.likesCount).toBe(0);
	});
});
