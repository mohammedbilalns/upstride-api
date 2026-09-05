import { describe, expect, it } from "vitest";
import { Article } from "../../../../src/domain/entities/article.entity";
import { EntityValidationError } from "../../../../src/domain/errors/entity-validation.error";

describe("Article Entity", () => {
	describe("constructor validation", () => {
		it("should create valid article", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: ["tech"] },
				"slug",
				"image.jpg",
				"Title",
				"Description",
				"Preview",
				["tag1"],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			expect(article.id).toBe("id");
			expect(article.authorId).toBe("author-1");
		});

		it("should throw when tags exceed 6", () => {
			const now = new Date();
			expect(() => {
				new Article(
					"id",
					"author-1",
					{ name: "John", interests: [] },
					"slug",
					"img",
					"Title",
					"Desc",
					"Preview",
					["t1", "t2", "t3", "t4", "t5", "t6", "t7"],
					true,
					0,
					0,
					0,
					false,
					false,
					null,
					null,
					null,
					now,
					now,
				);
			}).toThrow(EntityValidationError);
		});

		it("should allow exactly 6 tags", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				["t1", "t2", "t3", "t4", "t5", "t6"],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			expect(article.tags.length).toBe(6);
		});

		it("should allow empty tags", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			expect(article.tags.length).toBe(0);
		});
	});

	describe("canUpdate", () => {
		it("should throw when actor is not MENTOR", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			expect(() => article.canUpdate("USER" as never, "author-1")).toThrow();
		});

		it("should throw when actor is not author", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			expect(() => article.canUpdate("MENTOR", "other-user")).toThrow();
		});

		it("should allow MENTOR author to update", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			expect(() => article.canUpdate("MENTOR", "author-1")).not.toThrow();
		});
	});

	describe("canDelete", () => {
		it("should throw when article is blocked", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				true,
				"reason",
				now,
				"report-1",
				now,
				now,
			);

			expect(() => article.canDelete("author-1")).toThrow();
		});

		it("should throw when article is not active", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				false,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			expect(() => article.canDelete("author-1")).toThrow();
		});

		it("should throw when actor is not author", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			expect(() => article.canDelete("other-user")).toThrow();
		});

		it("should allow delete for active unblocked article by author", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			expect(() => article.canDelete("author-1")).not.toThrow();
		});
	});

	describe("block", () => {
		it("should return partial with blocking data", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			const result = article.block("Bad content", "report-1");

			expect(result.isActive).toBe(false);
			expect(result.isArchived).toBe(true);
			expect(result.isBlockedByAdmin).toBe(true);
			expect(result.blockingReason).toBe("Bad content");
			expect(result.blockedByReportId).toBe("report-1");
			expect(result.blockedAt).toBeInstanceOf(Date);
		});
	});

	describe("unblock", () => {
		it("should return partial clearing blocking data", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				true,
				"reason",
				now,
				"report-1",
				now,
				now,
			);

			const result = article.unblock();

			expect(result.isActive).toBe(true);
			expect(result.isArchived).toBe(false);
			expect(result.isBlockedByAdmin).toBe(false);
			expect(result.blockingReason).toBeNull();
			expect(result.blockedAt).toBeNull();
			expect(result.blockedByReportId).toBeNull();
		});
	});

	describe("incrementLikes", () => {
		it("should increment likes", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				5,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			const result = article.incrementLikes();
			expect(result.likesCount).toBe(6);
		});

		it("should increment from zero", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			const result = article.incrementLikes();
			expect(result.likesCount).toBe(1);
		});
	});

	describe("decrementLikes", () => {
		it("should decrement likes", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				5,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			const result = article.decrementLikes();
			expect(result.likesCount).toBe(4);
		});

		it("should not go below zero", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			const result = article.decrementLikes();
			expect(result.likesCount).toBe(0);
		});
	});

	describe("decrementComments", () => {
		it("should decrement comments", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				5,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			const result = article.decrementComments();
			expect(result.commentsCount).toBe(4);
		});

		it("should not go below zero", () => {
			const now = new Date();
			const article = new Article(
				"id",
				"author-1",
				{ name: "John", interests: [] },
				"slug",
				"img",
				"Title",
				"Desc",
				"Preview",
				[],
				true,
				0,
				0,
				0,
				false,
				false,
				null,
				null,
				null,
				now,
				now,
			);

			const result = article.decrementComments();
			expect(result.commentsCount).toBe(0);
		});
	});
});
