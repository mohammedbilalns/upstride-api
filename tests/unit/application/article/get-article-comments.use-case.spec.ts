import { beforeEach, describe, expect, it } from "vitest";
import type { GetArticleCommentsInput } from "../../../../src/application/modules/article/dtos/article-input.dto";
import { GetArticleCommentsUseCase } from "../../../../src/application/modules/article/use-cases/get-article-comments.use-case";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type {
	IArticleCommentRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import { createArticleComment } from "../../../factories/entities/article-comment.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetArticleCommentsUseCase", () => {
	let commentRepository: ReturnType<
		typeof createMock<IArticleCommentRepository>
	>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetArticleCommentsUseCase;

	const mockComments = [
		createArticleComment({
			id: "comment-1",
			articleId: "article-1",
			userId: "user-1",
			content: "Comment 1",
		}),
		createArticleComment({
			id: "comment-2",
			articleId: "article-1",
			userId: "user-2",
			content: "Comment 2",
		}),
	];

	const mockUsers: Record<string, ReturnType<typeof createUser>> = {
		"user-1": createUser({
			id: "user-1",
			name: "User One",
			profilePictureId: "pic-1",
		}),
		"user-2": createUser({
			id: "user-2",
			name: "User Two",
			profilePictureId: "pic-2",
		}),
	};

	beforeEach(() => {
		commentRepository = createMock<IArticleCommentRepository>();
		userRepository = createMock<IUserRepository>();
		storageService = createMock<IStorageService>();

		useCase = new GetArticleCommentsUseCase(
			commentRepository,
			userRepository,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
		userRepository.findById.mockImplementation(
			async (id: string) => mockUsers[id] || null,
		);
	});

	const baseInput: GetArticleCommentsInput = {
		articleId: "article-1",
		page: 1,
	};

	it("should return paginated comments for article", async () => {
		const mockPaginatedResult = {
			items: mockComments,
			total: 2,
			page: 1,
			limit: 5,
			totalPages: 1,
		};

		commentRepository.paginate.mockResolvedValue(mockPaginatedResult);

		const result = await useCase.execute(baseInput);

		expect(commentRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 5,
			query: { articleId: "article-1", parentId: null },
		});
		expect(result.items).toHaveLength(2);
		expect(result.total).toBe(2);
	});

	it("should filter by parentId for replies", async () => {
		const input: GetArticleCommentsInput = {
			...baseInput,
			parentId: "comment-1",
		};
		commentRepository.paginate.mockResolvedValue({
			items: [mockComments[0]],
			total: 1,
			page: 1,
			limit: 5,
			totalPages: 1,
		});

		await useCase.execute(input);

		expect(commentRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 5,
			query: { articleId: "article-1", parentId: "comment-1" },
		});
	});

	it("should include author snapshot with avatar URL", async () => {
		commentRepository.paginate.mockResolvedValue({
			items: mockComments,
			total: 2,
			page: 1,
			limit: 5,
			totalPages: 1,
		});

		const result = await useCase.execute(baseInput);

		expect(result.items[0].authorSnapshot.name).toBe("User One");
		expect(result.items[0].authorSnapshot.avatarUrl).toBe(
			"https://storage.example.com/pic-1",
		);
		expect(result.items[1].authorSnapshot.name).toBe("User Two");
		expect(result.items[1].authorSnapshot.avatarUrl).toBe(
			"https://storage.example.com/pic-2",
		);
	});

	it("should handle unknown user gracefully", async () => {
		const commentWithUnknownUser = createArticleComment({
			id: "comment-3",
			articleId: "article-1",
			userId: "unknown-user",
			content: "Unknown user comment",
		});
		commentRepository.paginate.mockResolvedValue({
			items: [commentWithUnknownUser],
			total: 1,
			page: 1,
			limit: 5,
			totalPages: 1,
		});
		userRepository.findById.mockResolvedValue(null);

		const result = await useCase.execute(baseInput);

		expect(result.items[0].authorSnapshot.name).toBe("Unknown User");
		expect(result.items[0].authorSnapshot.avatarUrl).toBeUndefined();
	});

	it("should handle user without profile picture", async () => {
		const userWithoutPic = createUser({
			id: "user-3",
			name: "User Three",
			profilePictureId: null,
		});
		const comment = createArticleComment({
			id: "comment-3",
			articleId: "article-1",
			userId: "user-3",
		});
		commentRepository.paginate.mockResolvedValue({
			items: [comment],
			total: 1,
			page: 1,
			limit: 5,
			totalPages: 1,
		});
		userRepository.findById.mockResolvedValue(userWithoutPic);

		const result = await useCase.execute(baseInput);

		expect(result.items[0].authorSnapshot.avatarUrl).toBeUndefined();
	});
});
