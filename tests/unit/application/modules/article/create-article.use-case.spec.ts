import { beforeEach, describe, expect, it } from "vitest";
import type { CreateArticleInput } from "../../../../../src/application/modules/article/dtos/article-input.dto";
import { MentorOnlyArticleActionError } from "../../../../../src/application/modules/article/errors";
import { CreateArticleUseCase } from "../../../../../src/application/modules/article/use-cases/create-article.use-case";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import type { IStorageService } from "../../../../../src/application/services/storage.service.interface";
import type {
	IArticleRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createArticle } from "../../../../factories/entities/article.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("CreateArticleUseCase", () => {
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: CreateArticleUseCase;

	const input: CreateArticleInput = {
		userId: "mentor-1",
		title: "Test Article",
		description: "This is a test article description",
		featuredImageUrl: "image.png",
		tags: ["nestjs", "typescript"],
	};

	const mockMentorUser = createUser({
		id: "mentor-1",
		name: "John Mentor",
		role: "MENTOR",
		profilePictureId: "profile-1",
		preferences: {
			interests: ["Backend", "TypeScript"],
			skills: [],
		},
	});

	const mockCreatedArticle = createArticle({
		id: "article-1",
		authorId: "mentor-1",
		slug: "test-article",
		title: input.title,
		description: input.description,
		featuredImageUrl: input.featuredImageUrl,
		tags: input.tags ?? [],
	});

	beforeEach(() => {
		articleRepository = createMock<IArticleRepository>();
		userRepository = createMock<IUserRepository>();
		storageService = createMock<IStorageService>();

		useCase = new CreateArticleUseCase(
			articleRepository,
			userRepository,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
		articleRepository.query.mockResolvedValue([]);
	});

	it("should throw UserNotFoundError when user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);

		expect(articleRepository.create).not.toHaveBeenCalled();
	});

	it("should throw MentorOnlyArticleActionError when user is not a mentor", async () => {
		const regularUser = createUser({ id: "user-1", role: "USER" });
		userRepository.findById.mockResolvedValue(regularUser);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			MentorOnlyArticleActionError,
		);

		expect(articleRepository.create).not.toHaveBeenCalled();
	});

	it("should create article successfully for mentor user", async () => {
		userRepository.findById.mockResolvedValue(mockMentorUser);
		articleRepository.create.mockResolvedValue(mockCreatedArticle);

		const result = await useCase.execute(input);

		expect(userRepository.findById).toHaveBeenCalledWith(input.userId);
		expect(storageService.getPublicUrl).toHaveBeenCalledWith("profile-1");
		expect(articleRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				authorId: mockMentorUser.id,
				title: input.title,
				description: input.description,
				featuredImageUrl: input.featuredImageUrl,
				tags: input.tags,
			}),
		);
		expect(result.article.title).toBe(input.title);
		expect(result.article.description).toBe(input.description);
	});

	it("should generate slug from title and check uniqueness", async () => {
		userRepository.findById.mockResolvedValue(mockMentorUser);
		articleRepository.create.mockResolvedValue(mockCreatedArticle);

		await useCase.execute(input);

		expect(articleRepository.query).toHaveBeenCalledWith({
			query: { slug: expect.any(String) },
		});
	});

	it("should generate preview content from description", async () => {
		userRepository.findById.mockResolvedValue(mockMentorUser);
		articleRepository.create.mockResolvedValue(mockCreatedArticle);

		await useCase.execute(input);

		const createdArticleArg = articleRepository.create.mock.calls[0][0];
		expect(createdArticleArg.previewContent).toBeDefined();
		expect(createdArticleArg.previewContent.length).toBeLessThanOrEqual(
			input.description.length,
		);
	});

	it("should use empty string for featuredImageUrl when not provided", async () => {
		const inputWithoutImage: CreateArticleInput = {
			...input,
			featuredImageUrl: "",
		};
		userRepository.findById.mockResolvedValue(mockMentorUser);
		articleRepository.create.mockResolvedValue(mockCreatedArticle);

		await useCase.execute(inputWithoutImage);

		const createdArticleArg = articleRepository.create.mock.calls[0][0];
		expect(createdArticleArg.featuredImageUrl).toBe("");
	});

	it("should return article DTO with signed featuredImageUrl", async () => {
		userRepository.findById.mockResolvedValue(mockMentorUser);
		articleRepository.create.mockResolvedValue(mockCreatedArticle);

		const result = await useCase.execute(input);

		expect(result.article.featuredImageUrl).toBe(
			"https://storage.example.com/image.png",
		);
	});
});
