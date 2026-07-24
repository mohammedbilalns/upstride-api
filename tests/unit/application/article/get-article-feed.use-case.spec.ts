import { beforeEach, describe, expect, it } from "vitest";
import type { GetArticleFeedInput } from "../../../../src/application/modules/article/dtos/article-input.dto";
import { GetArticleFeedUseCase } from "../../../../src/application/modules/article/use-cases/get-article-feed.usecase";
import { UserNotFoundError } from "../../../../src/application/modules/authentication/errors";
import type { IFeedCacheService } from "../../../../src/application/services";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type {
	IArticleRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import type { ArticleForFeed } from "../../../../src/shared/utilities/feed-scoring.util";
import { createArticle } from "../../../factories/entities/article.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetArticleFeedUseCase", () => {
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let feedCacheService: ReturnType<typeof createMock<IFeedCacheService>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetArticleFeedUseCase;

	const mockUser = createUser({
		id: "user-1",
		preferences: { interests: ["Backend", "TypeScript"], skills: [] },
	});

	const mockArticles = [
		createArticle({
			id: "article-1",
			authorId: "author-1",
			featuredImageUrl: "img-1",
		}),
		createArticle({
			id: "article-2",
			authorId: "author-2",
			featuredImageUrl: "img-2",
		}),
	];

	beforeEach(() => {
		articleRepository = createMock<IArticleRepository>();
		userRepository = createMock<IUserRepository>();
		feedCacheService = createMock<IFeedCacheService>();
		storageService = createMock<IStorageService>();

		useCase = new GetArticleFeedUseCase(
			articleRepository,
			userRepository,
			feedCacheService,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
	});

	const baseInput: GetArticleFeedInput = {
		userId: "user-1",
		page: 1,
		limit: 10,
	};

	it("should throw UserNotFoundError when user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should return empty result when user has no interests", async () => {
		const userNoInterests = createUser({
			id: "user-1",
			preferences: { interests: [], skills: [] },
		});
		userRepository.findById.mockResolvedValue(userNoInterests);

		const result = await useCase.execute(baseInput);

		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(0);
		expect(articleRepository.findFeedCandidates).not.toHaveBeenCalled();
	});

	it("should use cached feed IDs when available", async () => {
		userRepository.findById.mockResolvedValue(mockUser);
		feedCacheService.get.mockReturnValue([
			"article-1",
			"article-2",
			"article-3",
		]);
		articleRepository.query.mockResolvedValue(mockArticles);

		const result = await useCase.execute(baseInput);

		expect(feedCacheService.get).toHaveBeenCalledWith("feed:articles:user-1");
		expect(articleRepository.findFeedCandidates).not.toHaveBeenCalled();
		expect(result.items).toHaveLength(2);
	});

	it("should compute and cache feed when not cached", async () => {
		userRepository.findById.mockResolvedValue(mockUser);
		feedCacheService.get.mockReturnValue(null);
		articleRepository.findFeedCandidates.mockResolvedValue(
			mockArticles.map(
				(article): ArticleForFeed => ({
					id: article.id,
					interests: article.authorSnapshot.interests,
					views: article.views,
					createdAt: article.createdAt ?? new Date(),
				}),
			),
		);
		articleRepository.query.mockResolvedValue(mockArticles);

		const result = await useCase.execute(baseInput);

		expect(articleRepository.findFeedCandidates).toHaveBeenCalledWith(
			{
				isActive: true,
				isArchived: false,
				excludeAuthorId: "user-1",
			},
			150,
		);
		expect(feedCacheService.set).toHaveBeenCalledWith(
			"feed:articles:user-1",
			expect.any(Array),
		);
		expect(result.items).toHaveLength(2);
	});

	it("should return paginated results", async () => {
		userRepository.findById.mockResolvedValue(mockUser);
		feedCacheService.get.mockReturnValue([
			"article-1",
			"article-2",
			"article-3",
			"article-4",
			"article-5",
		]);
		articleRepository.query.mockResolvedValue([
			createArticle({
				id: "article-3",
				authorId: "author-3",
				featuredImageUrl: "img-3",
			}),
			createArticle({
				id: "article-4",
				authorId: "author-4",
				featuredImageUrl: "img-4",
			}),
		]);

		const result = await useCase.execute({ ...baseInput, page: 2, limit: 2 });

		expect(result.items).toHaveLength(2);
		expect(result.page).toBe(2);
		expect(result.limit).toBe(2);
		expect(result.total).toBe(5);
		expect(result.totalPages).toBe(3);
	});

	it("should return empty items when page has no IDs", async () => {
		userRepository.findById.mockResolvedValue(mockUser);
		feedCacheService.get.mockReturnValue(["article-1", "article-2"]);
		articleRepository.query.mockResolvedValue([]);

		const result = await useCase.execute({ ...baseInput, page: 3, limit: 2 });

		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(2);
	});

	it("should exclude author's own articles from feed candidates", async () => {
		userRepository.findById.mockResolvedValue(mockUser);
		feedCacheService.get.mockReturnValue(null);
		articleRepository.findFeedCandidates.mockResolvedValue(
			mockArticles.map(
				(article): ArticleForFeed => ({
					id: article.id,
					interests: article.authorSnapshot.interests,
					views: article.views,
					createdAt: article.createdAt ?? new Date(),
				}),
			),
		);
		articleRepository.query.mockResolvedValue(mockArticles);

		await useCase.execute(baseInput);

		expect(articleRepository.findFeedCandidates).toHaveBeenCalledWith(
			expect.objectContaining({ excludeAuthorId: "user-1" }),
			expect.any(Number),
		);
	});

	it("should return signed featuredImageUrl for each article", async () => {
		userRepository.findById.mockResolvedValue(mockUser);
		feedCacheService.get.mockReturnValue(["article-1", "article-2"]);
		articleRepository.query.mockResolvedValue(mockArticles);

		const result = await useCase.execute(baseInput);

		expect(result.items[0].featuredImageUrl).toBe(
			"https://storage.example.com/img-1",
		);
		expect(result.items[1].featuredImageUrl).toBe(
			"https://storage.example.com/img-2",
		);
	});
});
