import { beforeEach, describe, expect, it } from "vitest";
import type { UpdateArticleInput } from "../../../../../src/application/modules/article/dtos/article-input.dto";
import { ArticleNotFoundError } from "../../../../../src/application/modules/article/errors";
import { UpdateArticleUseCase } from "../../../../../src/application/modules/article/use-cases/update-article.use-case";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import type { IStorageService } from "../../../../../src/application/services/storage.service.interface";
import { EntityValidationError } from "../../../../../src/domain/errors";
import type {
	IArticleRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createArticle } from "../../../../factories/entities/article.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("UpdateArticleUseCase", () => {
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: UpdateArticleUseCase;

	const mockAuthor = createUser({
		id: "author-1",
		name: "Author User",
		role: "MENTOR",
	});

	const mockAdmin = createUser({
		id: "admin-1",
		name: "Admin User",
		role: "ADMIN",
	});

	const existingArticle = createArticle({
		id: "article-1",
		authorId: "author-1",
		title: "Original Title",
		description: "Original description",
		featuredImageUrl: "https://example.com/original.png",
		tags: ["original"],
		isArchived: false,
	});

	const updatedArticle = createArticle({
		...existingArticle,
		title: "Updated Title",
		description: "Updated description",
		featuredImageUrl: "updated.png",
		tags: ["updated"],
		isArchived: true,
	});

	beforeEach(() => {
		articleRepository = createMock<IArticleRepository>();
		userRepository = createMock<IUserRepository>();
		storageService = createMock<IStorageService>();

		useCase = new UpdateArticleUseCase(
			articleRepository,
			userRepository,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
	});

	const baseInput: UpdateArticleInput = {
		userId: "author-1",
		articleId: "article-1",
		title: "Updated Title",
		description: "Updated description",
		featuredImageUrl: "updated.png",
		tags: ["updated"],
		isArchived: true,
	};

	it("should throw UserNotFoundError when user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);

		expect(articleRepository.findById).not.toHaveBeenCalled();
	});

	it("should throw ArticleNotFoundError when article does not exist", async () => {
		userRepository.findById.mockResolvedValue(mockAuthor);
		articleRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleNotFoundError,
		);
	});

	it("should throw ArticleNotFoundError when update returns null", async () => {
		userRepository.findById.mockResolvedValue(mockAuthor);
		articleRepository.findById.mockResolvedValue(existingArticle);
		articleRepository.updateById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleNotFoundError,
		);
	});

	it("should allow author to update their article", async () => {
		userRepository.findById.mockResolvedValue(mockAuthor);
		articleRepository.findById.mockResolvedValue(existingArticle);
		articleRepository.updateById.mockResolvedValue(updatedArticle);
		userRepository.findById.mockResolvedValue(mockAuthor);

		const result = await useCase.execute(baseInput);

		expect(articleRepository.updateById).toHaveBeenCalledWith(
			"article-1",
			expect.objectContaining({
				title: "Updated Title",
				description: "Updated description",
				featuredImageUrl: "updated.png",
				previewContent: "Updated description",
				tags: ["updated"],
				isArchived: true,
			}),
		);
		expect(result.article.title).toBe("Updated Title");
	});

	it("should reject updating another user's article even for admin", async () => {
		userRepository.findById.mockResolvedValue(mockAdmin);
		articleRepository.findById.mockResolvedValue(existingArticle);

		const adminInput = { ...baseInput, userId: "admin-1" };
		await expect(useCase.execute(adminInput)).rejects.toBeInstanceOf(
			EntityValidationError,
		);
		expect(articleRepository.updateById).not.toHaveBeenCalled();
	});

	it("should throw ArticlePermissionError when another mentor tries to update", async () => {
		const otherUser = createUser({ id: "other-1", role: "MENTOR" });
		userRepository.findById.mockResolvedValue(otherUser);
		articleRepository.findById.mockResolvedValue(existingArticle);

		await expect(
			useCase.execute({ ...baseInput, userId: "other-1" }),
		).rejects.toThrow("You can only update your own articles");
	});

	it("should update only provided fields", async () => {
		const partialInput: UpdateArticleInput = {
			userId: "author-1",
			articleId: "article-1",
			title: "Only Title Updated",
		};

		userRepository.findById.mockResolvedValue(mockAuthor);
		articleRepository.findById.mockResolvedValue(existingArticle);
		articleRepository.updateById.mockResolvedValue(
			createArticle({ ...existingArticle, title: "Only Title Updated" }),
		);
		userRepository.findById.mockResolvedValue(mockAuthor);

		const result = await useCase.execute(partialInput);

		expect(articleRepository.updateById).toHaveBeenCalledWith(
			"article-1",
			expect.objectContaining({
				title: "Only Title Updated",
			}),
		);
		expect(result.article.title).toBe("Only Title Updated");
	});

	it("should generate preview content when description is updated", async () => {
		userRepository.findById.mockResolvedValue(mockAuthor);
		articleRepository.findById.mockResolvedValue(existingArticle);
		articleRepository.updateById.mockResolvedValue(
			createArticle({
				...existingArticle,
				description: "New description",
				previewContent: "New desc...",
			}),
		);
		userRepository.findById.mockResolvedValue(mockAuthor);

		await useCase.execute({ ...baseInput, description: "New description" });

		const updateArg = articleRepository.updateById.mock.calls[0][1];
		expect(updateArg.previewContent).toBeDefined();
	});

	it("should return article DTO with signed featuredImageUrl", async () => {
		userRepository.findById.mockResolvedValue(mockAuthor);
		articleRepository.findById.mockResolvedValue(existingArticle);
		articleRepository.updateById.mockResolvedValue(updatedArticle);
		userRepository.findById.mockResolvedValue(mockAuthor);

		const result = await useCase.execute(baseInput);

		expect(result.article.featuredImageUrl).toBe(
			"https://storage.example.com/updated.png",
		);
	});
});
