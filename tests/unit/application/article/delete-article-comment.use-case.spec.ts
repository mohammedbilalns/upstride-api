import { beforeEach, describe, expect, it } from "vitest";
import type { DeleteArticleCommentInput } from "../../../../src/application/modules/article/dtos/article-input.dto";
import {
	ArticleCommentNotFoundError,
	ArticleCommentOwnershipError,
} from "../../../../src/application/modules/article/errors";
import { DeleteArticleCommentUseCase } from "../../../../src/application/modules/article/use-cases/delete-article-comment.use-case";
import type {
	IArticleCommentRepository,
	IArticleRepository,
} from "../../../../src/domain/repositories";
import { createArticle } from "../../../factories/entities/article.factory";
import { createArticleComment } from "../../../factories/entities/article-comment.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("DeleteArticleCommentUseCase", () => {
	let commentRepository: ReturnType<
		typeof createMock<IArticleCommentRepository>
	>;
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let useCase: DeleteArticleCommentUseCase;

	const existingComment = createArticleComment({
		id: "comment-1",
		articleId: "article-1",
		userId: "user-1",
		content: "Comment to delete",
	});

	const mockArticle = createArticle({
		id: "article-1",
		authorId: "author-1",
		commentsCount: 5,
	});

	beforeEach(() => {
		commentRepository = createMock<IArticleCommentRepository>();
		articleRepository = createMock<IArticleRepository>();

		useCase = new DeleteArticleCommentUseCase(
			articleRepository,
			commentRepository,
		);
	});

	const baseInput: DeleteArticleCommentInput = {
		userId: "user-1",
		commentId: "comment-1",
	};

	it("should throw ArticleCommentNotFoundError when comment does not exist", async () => {
		commentRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleCommentNotFoundError,
		);
	});

	it("should throw ArticleCommentNotFoundError when comment is inactive", async () => {
		const inactiveComment = createArticleComment({
			...existingComment,
			isActive: false,
		});
		commentRepository.findById.mockResolvedValue(inactiveComment);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleCommentNotFoundError,
		);
	});

	it("should throw ArticleCommentOwnershipError when user is not the author", async () => {
		const otherUserComment = createArticleComment({
			...existingComment,
			userId: "other-user",
		});
		commentRepository.findById.mockResolvedValue(otherUserComment);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleCommentOwnershipError,
		);
	});

	it("should soft delete comment and decrement article comments count", async () => {
		commentRepository.findById.mockResolvedValue(existingComment);
		commentRepository.updateById.mockResolvedValue(
			createArticleComment({ ...existingComment, isActive: false }),
		);
		articleRepository.findById.mockResolvedValue(mockArticle);
		articleRepository.updateById.mockResolvedValue(mockArticle);

		const result = await useCase.execute(baseInput);

		expect(commentRepository.updateById).toHaveBeenCalledWith("comment-1", {
			isActive: false,
		});
		expect(articleRepository.updateById).toHaveBeenCalledWith(
			"article-1",
			expect.objectContaining({
				commentsCount: 4,
			}),
		);
		expect(result.commentId).toBe("comment-1");
	});

	it("should not decrement comments count when article not found", async () => {
		commentRepository.findById.mockResolvedValue(existingComment);
		commentRepository.updateById.mockResolvedValue(
			createArticleComment({ ...existingComment, isActive: false }),
		);
		articleRepository.findById.mockResolvedValue(null);

		const result = await useCase.execute(baseInput);

		expect(commentRepository.updateById).toHaveBeenCalledWith("comment-1", {
			isActive: false,
		});
		expect(articleRepository.updateById).not.toHaveBeenCalled();
		expect(result.commentId).toBe("comment-1");
	});
});
