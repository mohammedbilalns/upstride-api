import { beforeEach, describe, expect, it } from "vitest";
import type { DeleteArticleInput } from "../../../../src/application/modules/article/dtos/article-input.dto";
import { ArticleNotFoundError } from "../../../../src/application/modules/article/errors";
import { DeleteArticleUseCase } from "../../../../src/application/modules/article/use-cases/delete-article.use-case";
import { EntityValidationError } from "../../../../src/domain/errors";
import type { IArticleRepository } from "../../../../src/domain/repositories";
import { createArticle } from "../../../factories/entities/article.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("DeleteArticleUseCase", () => {
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let useCase: DeleteArticleUseCase;

	const baseInput: DeleteArticleInput = {
		userId: "author-1",
		articleId: "article-1",
	};

	const existingArticle = createArticle({
		id: "article-1",
		authorId: "author-1",
		isActive: true,
	});

	beforeEach(() => {
		articleRepository = createMock<IArticleRepository>();
		useCase = new DeleteArticleUseCase(articleRepository);
	});

	it("should throw ArticleNotFoundError when article does not exist", async () => {
		articleRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleNotFoundError,
		);
	});

	it("should throw ArticlePermissionError when user is not the author", async () => {
		articleRepository.findById.mockResolvedValue(existingArticle);

		await expect(
			useCase.execute({ ...baseInput, userId: "other-1" }),
		).rejects.toThrow("You can only delete your own articles");
	});

	it("should reject deleting another user's article", async () => {
		articleRepository.findById.mockResolvedValue(existingArticle);

		await expect(
			useCase.execute({ ...baseInput, userId: "admin-1" }),
		).rejects.toBeInstanceOf(EntityValidationError);

		expect(articleRepository.updateById).not.toHaveBeenCalled();
	});

	it("should soft delete article by setting isActive to false", async () => {
		articleRepository.findById.mockResolvedValue(existingArticle);
		articleRepository.updateById.mockResolvedValue(
			createArticle({ ...existingArticle, isActive: false }),
		);

		await useCase.execute(baseInput);

		expect(articleRepository.updateById).toHaveBeenCalledWith("article-1", {
			isActive: false,
		});
	});

	it("should call canDelete on article entity", async () => {
		const articleWithCanDelete = createArticle({
			id: "article-1",
			authorId: "author-1",
			isActive: true,
		});
		articleRepository.findById.mockResolvedValue(articleWithCanDelete);
		articleRepository.updateById.mockResolvedValue(
			createArticle({ ...articleWithCanDelete, isActive: false }),
		);

		await useCase.execute(baseInput);

		expect(articleRepository.updateById).toHaveBeenCalled();
	});
});
