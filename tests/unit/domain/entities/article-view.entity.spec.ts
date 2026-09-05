import { describe, expect, it } from "vitest";
import { ArticleView } from "../../../../src/domain/entities/article-view.entity";

describe("ArticleView Entity", () => {
	describe("constructor", () => {
		it("should create a valid article view", () => {
			const view = new ArticleView("view-1", "article-1", "user-1");

			expect(view.id).toBe("view-1");
			expect(view.articleId).toBe("article-1");
			expect(view.userId).toBe("user-1");
		});

		it("should track different views from different users", () => {
			const view1 = new ArticleView("view-1", "article-1", "user-1");
			const view2 = new ArticleView("view-2", "article-1", "user-2");
			const view3 = new ArticleView("view-3", "article-2", "user-1");

			expect(view1.articleId).toBe(view2.articleId);
			expect(view1.articleId).not.toBe(view3.articleId);
			expect(view1.userId).not.toBe(view2.userId);
			expect(view1.userId).toBe(view3.userId);
		});

		it("should allow same user to view same article multiple times with different view records", () => {
			const view1 = new ArticleView("view-1", "article-1", "user-1");
			const view2 = new ArticleView("view-2", "article-1", "user-1");

			expect(view1.articleId).toBe(view2.articleId);
			expect(view1.userId).toBe(view2.userId);
			expect(view1.id).not.toBe(view2.id);
		});
	});
});
