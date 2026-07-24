import { beforeEach, describe, expect, it } from "vitest";
import type { EventBus } from "../../../../src/application/events/event-bus.interface";
import type { CreateArticleCommentInput } from "../../../../src/application/modules/article/dtos/article-input.dto";
import {
	ArticleCommentNotFoundError,
	ArticleNotFoundError,
} from "../../../../src/application/modules/article/errors";
import { CreateArticleCommentUseCase } from "../../../../src/application/modules/article/use-cases/create-article-comment.use-case";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type {
	IArticleCommentRepository,
	IArticleRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import { createArticle } from "../../../factories/entities/article.factory";
import { createArticleComment } from "../../../factories/entities/article-comment.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("CreateArticleCommentUseCase", () => {
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let commentRepository: ReturnType<
		typeof createMock<IArticleCommentRepository>
	>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let eventBus: ReturnType<typeof createMock<EventBus>>;
	let useCase: CreateArticleCommentUseCase;

	const mockUser = createUser({
		id: "user-1",
		name: "Commenter",
		profilePictureId: "pic-1",
	});

	const mockArticle = createArticle({
		id: "article-1",
		authorId: "author-1",
		slug: "test-article",
		isActive: true,
		commentsCount: 5,
	});

	const mockParentComment = createArticleComment({
		id: "parent-1",
		articleId: "article-1",
		repliesCount: 2,
	});

	beforeEach(() => {
		articleRepository = createMock<IArticleRepository>();
		commentRepository = createMock<IArticleCommentRepository>();
		userRepository = createMock<IUserRepository>();
		storageService = createMock<IStorageService>();
		eventBus = createMock<EventBus>();

		useCase = new CreateArticleCommentUseCase(
			articleRepository,
			commentRepository,
			userRepository,
			storageService,
			eventBus,
		);

		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
	});

	const baseInput: CreateArticleCommentInput = {
		userId: "user-1",
		articleId: "article-1",
		content: "This is a comment",
	};

	it("should throw ArticleNotFoundError when article does not exist", async () => {
		articleRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleNotFoundError,
		);
	});

	it("should throw ArticleNotFoundError when article is not active", async () => {
		const inactiveArticle = createArticle({ ...mockArticle, isActive: false });
		articleRepository.findById.mockResolvedValue(inactiveArticle);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleNotFoundError,
		);
	});

	it("should throw ArticleCommentNotFoundError when parent comment does not exist", async () => {
		const input: CreateArticleCommentInput = {
			...baseInput,
			parentId: "non-existent",
		};
		articleRepository.findById.mockResolvedValue(mockArticle);
		commentRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			ArticleCommentNotFoundError,
		);
	});

	it("should throw ArticleCommentNotFoundError when parent comment is not active", async () => {
		const input: CreateArticleCommentInput = {
			...baseInput,
			parentId: "parent-1",
		};
		const inactiveParent = createArticleComment({
			...mockParentComment,
			isActive: false,
		});
		articleRepository.findById.mockResolvedValue(mockArticle);
		commentRepository.findById.mockResolvedValue(inactiveParent);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			ArticleCommentNotFoundError,
		);
	});

	it("should throw ArticleCommentNotFoundError when parent comment belongs to different article", async () => {
		const input: CreateArticleCommentInput = {
			...baseInput,
			parentId: "parent-1",
		};
		const wrongArticleParent = createArticleComment({
			...mockParentComment,
			articleId: "other-article",
		});
		articleRepository.findById.mockResolvedValue(mockArticle);
		commentRepository.findById.mockResolvedValue(wrongArticleParent);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			ArticleCommentNotFoundError,
		);
	});

	it("should create top-level comment successfully", async () => {
		const createdComment = createArticleComment({
			id: "comment-1",
			articleId: "article-1",
			userId: "user-1",
			content: baseInput.content,
		});

		articleRepository.findById.mockResolvedValue(mockArticle);
		commentRepository.create.mockResolvedValue(createdComment);
		articleRepository.updateById.mockResolvedValue(mockArticle);
		userRepository.findById.mockResolvedValue(mockUser);

		const result = await useCase.execute(baseInput);

		expect(commentRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				articleId: "article-1",
				userId: "user-1",
				content: baseInput.content,
				parentId: null,
			}),
		);
		expect(articleRepository.updateById).toHaveBeenCalledWith("article-1", {
			commentsCount: 6,
		});
		expect(result.comment.content).toBe(baseInput.content);
		expect(result.comment.authorSnapshot.name).toBe("Commenter");
	});

	it("should create reply to parent comment", async () => {
		const input: CreateArticleCommentInput = {
			...baseInput,
			parentId: "parent-1",
		};
		const createdComment = createArticleComment({
			id: "comment-1",
			articleId: "article-1",
			userId: "user-1",
			content: baseInput.content,
			parentId: "parent-1",
		});

		articleRepository.findById.mockResolvedValue(mockArticle);
		commentRepository.findById.mockResolvedValue(mockParentComment);
		commentRepository.create.mockResolvedValue(createdComment);
		articleRepository.updateById.mockResolvedValue(mockArticle);
		userRepository.findById.mockResolvedValue(mockUser);

		await useCase.execute(input);

		expect(commentRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				parentId: "parent-1",
			}),
		);
		expect(commentRepository.updateById).toHaveBeenCalledWith("parent-1", {
			repliesCount: 3,
		});
	});

	it("should increment replies count for all ancestors", async () => {
		const grandParent = createArticleComment({
			id: "grandparent-1",
			articleId: "article-1",
			parentId: null,
			repliesCount: 1,
		});
		const parent = createArticleComment({
			id: "parent-1",
			articleId: "article-1",
			parentId: "grandparent-1",
			repliesCount: 1,
		});
		const input: CreateArticleCommentInput = {
			...baseInput,
			parentId: "parent-1",
		};

		articleRepository.findById.mockResolvedValue(mockArticle);
		commentRepository.findById
			.mockResolvedValueOnce(parent)
			.mockResolvedValueOnce(parent)
			.mockResolvedValueOnce(grandParent)
			.mockResolvedValueOnce(null);
		commentRepository.create.mockResolvedValue(
			createArticleComment({ parentId: "parent-1" }),
		);
		articleRepository.updateById.mockResolvedValue(mockArticle);
		userRepository.findById.mockResolvedValue(mockUser);

		await useCase.execute(input);

		expect(commentRepository.updateById).toHaveBeenCalledWith("parent-1", {
			repliesCount: 2,
		});
		expect(commentRepository.updateById).toHaveBeenCalledWith("grandparent-1", {
			repliesCount: 2,
		});
	});

	it("should publish ArticleCommentCreatedEvent", async () => {
		const createdComment = createArticleComment({
			id: "comment-1",
			articleId: "article-1",
		});
		articleRepository.findById.mockResolvedValue(mockArticle);
		commentRepository.create.mockResolvedValue(createdComment);
		articleRepository.updateById.mockResolvedValue(mockArticle);
		userRepository.findById.mockResolvedValue(mockUser);

		await useCase.execute(baseInput);

		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					articleId: "article-1",
					articleSlug: "test-article",
					articleAuthorId: "author-1",
					commentId: "comment-1",
					actorId: "user-1",
					actorName: "Commenter",
					count: 6,
					parentId: null,
				}),
			}),
		);
	});

	it("should include parentId in event when replying", async () => {
		const input: CreateArticleCommentInput = {
			...baseInput,
			parentId: "parent-1",
		};
		const createdComment = createArticleComment({
			id: "comment-1",
			parentId: "parent-1",
		});
		articleRepository.findById.mockResolvedValue(mockArticle);
		commentRepository.findById.mockResolvedValue(mockParentComment);
		commentRepository.create.mockResolvedValue(createdComment);
		articleRepository.updateById.mockResolvedValue(mockArticle);
		userRepository.findById.mockResolvedValue(mockUser);

		await useCase.execute(input);

		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					parentId: "parent-1",
				}),
			}),
		);
	});
});
