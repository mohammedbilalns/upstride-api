import { beforeEach, describe, expect, it } from "vitest";
import type { GetArticlesInput } from "../../../../src/application/modules/article/dtos/article-input.dto";
import { GetArticlesUseCase } from "../../../../src/application/modules/article/use-cases/get-articles.use-case";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type {
	IArticleRepository,
	IInterestRepository,
	IMentorListReadRepository,
} from "../../../../src/domain/repositories";
import { createArticle } from "../../../factories/entities/article.factory";
import { createInterest } from "../../../factories/entities/interest.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetArticlesUseCase", () => {
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let interestRepository: ReturnType<typeof createMock<IInterestRepository>>;
	let mentorRepository: ReturnType<
		typeof createMock<IMentorListReadRepository>
	>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetArticlesUseCase;

	beforeEach(() => {
		articleRepository = createMock<IArticleRepository>();
		interestRepository = createMock<IInterestRepository>();
		mentorRepository = createMock<IMentorListReadRepository>();
		storageService = createMock<IStorageService>();

		useCase = new GetArticlesUseCase(
			articleRepository,
			interestRepository,
			mentorRepository,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
	});

	const baseInput: GetArticlesInput = {
		page: 1,
		limit: 6,
	};

	const mockArticles = [
		createArticle({
			id: "article-1",
			title: "Article 1",
			featuredImageUrl: "img-1",
		}),
		createArticle({
			id: "article-2",
			title: "Article 2",
			featuredImageUrl: "img-2",
		}),
	];

	it("should return paginated articles with default filters", async () => {
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		const result = await useCase.execute(baseInput);

		expect(articleRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 6,
			query: expect.objectContaining({
				isActive: true,
				isArchived: false,
			}),
		});
		expect(result.items).toHaveLength(2);
	});

	it("should filter by search term", async () => {
		const input: GetArticlesInput = { ...baseInput, search: "nestjs" };
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(articleRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({ title: "nestjs" }),
			}),
		);
	});

	it("should filter by tag", async () => {
		const input: GetArticlesInput = { ...baseInput, tag: "typescript" };
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(articleRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({ tags: "typescript" }),
			}),
		);
	});

	it("should filter by multiple tags", async () => {
		const input: GetArticlesInput = { ...baseInput, tag: "nestjs,typescript" };
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(articleRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({ tags: ["nestjs", "typescript"] }),
			}),
		);
	});

	it("should filter by category/interest", async () => {
		const mockInterest = createInterest({ id: "interest-1", name: "Backend" });
		const input: GetArticlesInput = { ...baseInput, category: "Backend" };

		interestRepository.query.mockResolvedValue([mockInterest]);
		mentorRepository.findUserIdsByExpertise.mockResolvedValue([
			"mentor-1",
			"mentor-2",
		]);
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(interestRepository.query).toHaveBeenCalledWith({
			query: { name: "Backend" },
		});
		expect(mentorRepository.findUserIdsByExpertise).toHaveBeenCalledWith(
			"interest-1",
		);
		expect(articleRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({ authorId: ["mentor-1", "mentor-2"] }),
			}),
		);
	});

	it("should return empty result when interest not found", async () => {
		const input: GetArticlesInput = { ...baseInput, category: "NonExistent" };

		interestRepository.query.mockResolvedValue([]);

		const result = await useCase.execute(input);

		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(0);
	});

	it("should filter by authorId for mentor view", async () => {
		const input: GetArticlesInput = {
			...baseInput,
			isMentorView: true,
			authorId: "mentor-1",
		};
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(articleRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({ authorId: "mentor-1" }),
			}),
		);
	});

	it("should filter by status active", async () => {
		const input: GetArticlesInput = { ...baseInput, status: "active" };
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(articleRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({ isActive: true, isArchived: false }),
			}),
		);
	});

	it("should filter by status blocked", async () => {
		const input: GetArticlesInput = { ...baseInput, status: "blocked" };
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(articleRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({ isBlockedByAdmin: true }),
			}),
		);
	});

	it("should exclude viewer's own articles", async () => {
		const input: GetArticlesInput = { ...baseInput, viewerUserId: "viewer-1" };
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(articleRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({ excludeAuthorId: "viewer-1" }),
			}),
		);
	});

	it("should filter by specific IDs", async () => {
		const input: GetArticlesInput = {
			...baseInput,
			ids: ["article-1", "article-2"],
		};
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(articleRepository.paginate).toHaveBeenCalledWith(
			expect.objectContaining({
				query: expect.objectContaining({ ids: ["article-1", "article-2"] }),
			}),
		);
	});

	it("should return signed featuredImageUrl for each article", async () => {
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		const result = await useCase.execute(baseInput);

		expect(result.items[0].featuredImageUrl).toBe(
			"https://storage.example.com/img-1",
		);
		expect(result.items[1].featuredImageUrl).toBe(
			"https://storage.example.com/img-2",
		);
	});

	it("should handle admin view with no filters", async () => {
		const input: GetArticlesInput = { ...baseInput, isAdminView: true };
		articleRepository.paginate.mockResolvedValue({
			items: mockArticles,
			total: 2,
			page: 1,
			limit: 6,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(articleRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 6,
			query: expect.objectContaining({ isAdminView: true }),
		});
	});
});
