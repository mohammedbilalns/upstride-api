import { beforeEach, describe, expect, it } from "vitest";
import type { GetArticleInput } from "../../../../src/application/modules/article/dtos/article-input.dto";
import { ArticleNotFoundError } from "../../../../src/application/modules/article/errors";
import { GetArticleUseCase } from "../../../../src/application/modules/article/use-cases/get-article.use-case";
import type { IMarkArticleViewUseCase } from "../../../../src/application/modules/article/use-cases/mark-article-view.use-case.interface";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type {
	IArticleReactionRepository,
	IArticleRepository,
	IReportRepository,
} from "../../../../src/domain/repositories";
import { createArticle } from "../../../factories/entities/article.factory";
import { createReport } from "../../../factories/entities/report.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetArticleUseCase", () => {
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let reactionRepository: ReturnType<
		typeof createMock<IArticleReactionRepository>
	>;
	let reportRepository: ReturnType<typeof createMock<IReportRepository>>;
	let markArticleViewUseCase: ReturnType<
		typeof createMock<IMarkArticleViewUseCase>
	>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetArticleUseCase;

	const mockArticle = createArticle({
		id: "article-1",
		authorId: "author-1",
		slug: "test-article",
		isActive: true,
		authorSnapshot: {
			name: "Author",
			interests: [],
			avatarUrl: undefined,
			isBlocked: false,
		},
	});

	const mockViewerUserId = "viewer-1";

	beforeEach(() => {
		articleRepository = createMock<IArticleRepository>();
		reactionRepository = createMock<IArticleReactionRepository>();
		reportRepository = createMock<IReportRepository>();
		markArticleViewUseCase = createMock<IMarkArticleViewUseCase>();
		storageService = createMock<IStorageService>();

		useCase = new GetArticleUseCase(
			articleRepository,
			reactionRepository,
			reportRepository,
			markArticleViewUseCase,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
	});

	const baseInput: GetArticleInput = {
		slug: "test-article",
		viewerUserId: mockViewerUserId,
	};

	it("should throw ArticleNotFoundError when article not found by slug", async () => {
		articleRepository.findBySlug.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleNotFoundError,
		);
	});

	it("should throw ArticleNotFoundError when article is inactive and viewer is not author or admin", async () => {
		const inactiveArticle = createArticle({ ...mockArticle, isActive: false });
		articleRepository.findBySlug.mockResolvedValue(inactiveArticle);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleNotFoundError,
		);
	});

	it("should allow author to view their inactive article", async () => {
		const inactiveArticle = createArticle({
			...mockArticle,
			isActive: false,
			authorId: mockViewerUserId,
		});
		articleRepository.findBySlug.mockResolvedValue(inactiveArticle);
		reactionRepository.query.mockResolvedValue([]);
		reportRepository.query.mockResolvedValue([]);

		const result = await useCase.execute(baseInput);

		expect(result.article.id).toBe("article-1");
	});

	it("should allow admin to view inactive article", async () => {
		const inactiveArticle = createArticle({ ...mockArticle, isActive: false });
		const adminInput: GetArticleInput = { ...baseInput, isAdminView: true };
		articleRepository.findBySlug.mockResolvedValue(inactiveArticle);
		reactionRepository.query.mockResolvedValue([]);
		reportRepository.query.mockResolvedValue([]);

		const result = await useCase.execute(adminInput);

		expect(result.article.id).toBe("article-1");
	});

	it("should throw ArticleNotFoundError when author is blocked and viewer is not author or admin", async () => {
		const blockedAuthorArticle = createArticle({
			...mockArticle,
			authorSnapshot: { ...mockArticle.authorSnapshot, isBlocked: true },
		});
		articleRepository.findBySlug.mockResolvedValue(blockedAuthorArticle);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleNotFoundError,
		);
	});

	it("should return user reaction when viewer has reacted", async () => {
		articleRepository.findBySlug.mockResolvedValue(mockArticle);
		reactionRepository.query.mockResolvedValue([
			{
				id: "reaction-1",
				resourceId: "article-1",
				userId: mockViewerUserId,
				reactionType: "LIKE",
				createdAt: new Date("2024-01-01T00:00:00.000Z"),
			},
		]);
		reportRepository.query.mockResolvedValue([]);

		const result = await useCase.execute(baseInput);

		expect(result.userReaction).toBe("LIKE");
	});

	it("should return isReported true when viewer has pending report", async () => {
		articleRepository.findBySlug.mockResolvedValue(mockArticle);
		reactionRepository.query.mockResolvedValue([]);
		reportRepository.query.mockResolvedValue([
			createReport({ id: "report-1" }),
		]);

		const result = await useCase.execute(baseInput);

		expect(result.isReported).toBe(true);
	});

	it("should call markArticleViewUseCase when viewerUserId provided", async () => {
		articleRepository.findBySlug.mockResolvedValue(mockArticle);
		reactionRepository.query.mockResolvedValue([]);
		reportRepository.query.mockResolvedValue([]);

		await useCase.execute(baseInput);

		expect(markArticleViewUseCase.execute).toHaveBeenCalledWith({
			articleId: mockArticle.id,
			viewerUserId: mockViewerUserId,
		});
	});

	it("should return appeal info for author", async () => {
		const authorInput: GetArticleInput = {
			...baseInput,
			viewerUserId: "author-1",
		};
		articleRepository.findBySlug.mockResolvedValue(mockArticle);
		reactionRepository.query.mockResolvedValue([]);
		reportRepository.query
			.mockResolvedValueOnce([]) // activeReports
			.mockResolvedValueOnce([
				createReport({
					appealMessage: "Please review",
					appealedAt: new Date("2024-01-01"),
				}),
			]);

		const result = await useCase.execute(authorInput);

		expect(result.appealMessage).toBe("Please review");
		expect(result.appealedAt).toBe("2024-01-01T00:00:00.000Z");
	});

	it("should return isAuthor true when viewer is author", async () => {
		const authorInput: GetArticleInput = {
			...baseInput,
			viewerUserId: "author-1",
		};
		articleRepository.findBySlug.mockResolvedValue(mockArticle);
		reactionRepository.query.mockResolvedValue([]);
		reportRepository.query.mockResolvedValue([]);

		const result = await useCase.execute(authorInput);

		expect(result.isAuthor).toBe(true);
	});

	it("should return signed featuredImageUrl", async () => {
		const articleWithImage = createArticle({
			...mockArticle,
			featuredImageUrl: "image-id",
		});
		articleRepository.findBySlug.mockResolvedValue(articleWithImage);
		reactionRepository.query.mockResolvedValue([]);
		reportRepository.query.mockResolvedValue([]);

		const result = await useCase.execute(baseInput);

		expect(result.article.featuredImageUrl).toBe(
			"https://storage.example.com/image-id",
		);
	});
});
