import { beforeEach, describe, expect, it } from "vitest";
import type { UpdateArticleCommentInput } from "../../../../src/application/modules/article/dtos/article-input.dto";
import {
	ArticleCommentNotFoundError,
	ArticleCommentOwnershipError,
} from "../../../../src/application/modules/article/errors";
import { UpdateArticleCommentUseCase } from "../../../../src/application/modules/article/use-cases/update-article-comment.use-case";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type {
	IArticleCommentRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import { createArticleComment } from "../../../factories/entities/article-comment.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("UpdateArticleCommentUseCase", () => {
	let commentRepository: ReturnType<
		typeof createMock<IArticleCommentRepository>
	>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: UpdateArticleCommentUseCase;

	const mockUser = createUser({ id: "user-1", name: "Commenter" });
	const existingComment = createArticleComment({
		id: "comment-1",
		articleId: "article-1",
		userId: "user-1",
		content: "Original content",
	});

	const updatedComment = createArticleComment({
		...existingComment,
		content: "Updated content",
	});

	beforeEach(() => {
		commentRepository = createMock<IArticleCommentRepository>();
		userRepository = createMock<IUserRepository>();
		storageService = createMock<IStorageService>();

		useCase = new UpdateArticleCommentUseCase(
			commentRepository,
			userRepository,
			storageService,
		);

		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
	});

	const baseInput: UpdateArticleCommentInput = {
		userId: "user-1",
		commentId: "comment-1",
		content: "Updated content",
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

	it("should throw ArticleCommentNotFoundError when update returns null", async () => {
		commentRepository.findById.mockResolvedValue(existingComment);
		commentRepository.updateById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleCommentNotFoundError,
		);
	});

	it("should update comment successfully", async () => {
		commentRepository.findById.mockResolvedValue(existingComment);
		commentRepository.updateById.mockResolvedValue(updatedComment);
		userRepository.findById.mockResolvedValue(mockUser);

		const result = await useCase.execute(baseInput);

		expect(commentRepository.updateById).toHaveBeenCalledWith("comment-1", {
			content: "Updated content",
		});
		expect(result.comment.content).toBe("Updated content");
	});

	it("should return comment with author snapshot", async () => {
		const userWithPic = createUser({
			id: "user-1",
			name: "Commenter",
			profilePictureId: "pic-1",
		});
		commentRepository.findById.mockResolvedValue(existingComment);
		commentRepository.updateById.mockResolvedValue(updatedComment);
		userRepository.findById.mockResolvedValue(userWithPic);

		const result = await useCase.execute(baseInput);

		expect(result.comment.authorSnapshot.name).toBe("Commenter");
		expect(result.comment.authorSnapshot.avatarUrl).toBe(
			"https://storage.example.com/pic-1",
		);
	});

	it("should handle user without profile picture", async () => {
		const userWithoutPic = createUser({
			id: "user-1",
			name: "Commenter",
			profilePictureId: null,
		});
		commentRepository.findById.mockResolvedValue(existingComment);
		commentRepository.updateById.mockResolvedValue(updatedComment);
		userRepository.findById.mockResolvedValue(userWithoutPic);

		const result = await useCase.execute(baseInput);

		expect(result.comment.authorSnapshot.avatarUrl).toBeUndefined();
	});

	it("should handle unknown user gracefully", async () => {
		commentRepository.findById.mockResolvedValue(existingComment);
		commentRepository.updateById.mockResolvedValue(updatedComment);
		userRepository.findById.mockResolvedValue(null);

		const result = await useCase.execute(baseInput);

		expect(result.comment.authorSnapshot.name).toBe("Unknown User");
		expect(result.comment.authorSnapshot.avatarUrl).toBeUndefined();
	});
});
