import { describe, expect, it } from "vitest";
import { ArticleReaction } from "../../../../src/domain/entities/article-reaction.entity";

describe("ArticleReaction Entity", () => {
	describe("constructor", () => {
		it("should create a valid article reaction", () => {
			const now = new Date();
			const reaction = new ArticleReaction(
				"reaction-1",
				"article-1",
				"user-1",
				"LIKE",
				now,
				"John Doe",
			);

			expect(reaction.id).toBe("reaction-1");
			expect(reaction.resourceId).toBe("article-1");
			expect(reaction.userId).toBe("user-1");
			expect(reaction.reactionType).toBe("LIKE");
			expect(reaction.createdAt).toEqual(now);
			expect(reaction.actorName).toBe("John Doe");
		});

		it("should allow null createdAt", () => {
			const reaction = new ArticleReaction(
				"reaction-2",
				"article-1",
				"user-2",
				"LIKE",
				null,
			);

			expect(reaction.createdAt).toBeNull();
		});

		it("should allow optional actor name", () => {
			const now = new Date();
			const reaction = new ArticleReaction(
				"reaction-3",
				"article-1",
				"user-3",
				"LIKE",
				now,
			);

			expect(reaction.actorName).toBeUndefined();
		});

		it("should track reactions from different users on same article", () => {
			const now = new Date();
			const reaction1 = new ArticleReaction(
				"reaction-1",
				"article-1",
				"user-1",
				"LIKE",
				now,
			);
			const reaction2 = new ArticleReaction(
				"reaction-2",
				"article-1",
				"user-2",
				"LIKE",
				now,
			);

			expect(reaction1.resourceId).toBe(reaction2.resourceId);
			expect(reaction1.userId).not.toBe(reaction2.userId);
		});

		it("should support LIKE reaction type", () => {
			const now = new Date();
			const reaction = new ArticleReaction(
				"reaction-4",
				"article-1",
				"user-4",
				"LIKE",
				now,
			);

			expect(reaction.reactionType).toBe("LIKE");
		});

		it("should store actor name when provided", () => {
			const now = new Date();
			const reaction = new ArticleReaction(
				"reaction-5",
				"article-1",
				"user-5",
				"LIKE",
				now,
				"Jane Smith",
			);

			expect(reaction.actorName).toBe("Jane Smith");
		});
	});
});
