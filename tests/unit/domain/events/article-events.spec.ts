import { describe, expect, it } from "vitest";
import { ArticleBlockedEvent } from "../../../../src/domain/events/article-blocked.event";
import { ArticleCommentCreatedEvent } from "../../../../src/domain/events/article-comment-created.event";
import { ArticleCommentReactionCreatedEvent } from "../../../../src/domain/events/article-comment-reaction-created.event";
import { ArticleReactionCreatedEvent } from "../../../../src/domain/events/article-reaction-created.event";
import { ArticleUnblockedEvent } from "../../../../src/domain/events/article-unblocked.event";

describe("Article Domain Events", () => {
	describe("ArticleBlockedEvent", () => {
		it("should create article blocked event", () => {
			const payload = {
				articleId: "article-1",
				authorId: "user-1",
				reason: "Inappropriate content",
			};

			const event = new ArticleBlockedEvent(payload);

			expect(event.eventName).toBe("article.blocked");
			expect(event.payload).toEqual(payload);
			expect(event.occurredAt).toBeInstanceOf(Date);
		});

		it("should store event payload correctly", () => {
			const payload = {
				articleId: "article-2",
				authorId: "user-2",
				reason: "Spam",
			};

			const event = new ArticleBlockedEvent(payload);

			expect(event.payload.articleId).toBe("article-2");
			expect(event.payload.authorId).toBe("user-2");
			expect(event.payload.reason).toBe("Spam");
		});
	});

	describe("ArticleUnblockedEvent", () => {
		it("should create article unblocked event", () => {
			const payload = {
				articleId: "article-3",
				authorId: "user-3",
			};

			const event = new ArticleUnblockedEvent(payload);

			expect(event.eventName).toBe("article.unblocked");
			expect(event.payload).toEqual(payload);
			expect(event.occurredAt).toBeInstanceOf(Date);
		});
	});

	describe("ArticleReactionCreatedEvent", () => {
		it("should create article reaction event", () => {
			const payload = {
				articleId: "article-4",
				articleSlug: "article-slug",
				articleAuthorId: "author-3",
				reactionType: "LIKE" as const,
				actorId: "user-4",
				actorName: "User 4",
				count: 1,
			};

			const event = new ArticleReactionCreatedEvent(payload);

			expect(event.eventName).toBe("article.reaction.created");
			expect(event.payload).toEqual(payload);
		});
	});

	describe("ArticleCommentCreatedEvent", () => {
		it("should create article comment created event", () => {
			const payload = {
				articleId: "article-5",
				articleSlug: "article-slug",
				articleAuthorId: "author-1",
				commentId: "comment-1",
				actorId: "user-5",
				actorName: "User 5",
				count: 1,
			};

			const event = new ArticleCommentCreatedEvent(payload);

			expect(event.eventName).toBe("article.comment.created");
			expect(event.payload).toEqual(payload);
		});
	});

	describe("ArticleCommentReactionCreatedEvent", () => {
		it("should create article comment reaction event", () => {
			const payload = {
				articleId: "article-6",
				articleSlug: "article-slug",
				articleAuthorId: "author-2",
				commentId: "comment-2",
				reactionType: "LIKE" as const,
				actorId: "user-6",
				actorName: "User 6",
				count: 1,
			};

			const event = new ArticleCommentReactionCreatedEvent(payload);

			expect(event.eventName).toBe("article.comment.reaction.created");
			expect(event.payload).toEqual(payload);
		});
	});
});
