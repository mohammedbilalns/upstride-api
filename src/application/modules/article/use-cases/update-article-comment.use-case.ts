import { inject, injectable } from "inversify";
import type {
	IArticleCommentRepository,
	IUserRepository,
} from "../../../../domain/repositories";
import { TYPES } from "../../../../shared/types/types";
import type { IStorageService } from "../../../services/storage.service.interface";
import type {
	UpdateArticleCommentInput,
	UpdateArticleCommentOutput,
} from "../dtos/article-input.dto";
import {
	ArticleCommentNotFoundError,
	ArticleCommentOwnershipError,
} from "../errors";
import { ArticleCommentMapper } from "../mappers/article-comment.mapper";
import type { IUpdateArticleCommentUseCase } from "./update-article-comment.use-case.interface";

@injectable()
export class UpdateArticleCommentUseCase
	implements IUpdateArticleCommentUseCase
{
	constructor(
		@inject(TYPES.Repositories.ArticleCommentRepository)
		private readonly _commentRepository: IArticleCommentRepository,
		@inject(TYPES.Repositories.UserRepository)
		private readonly _userRepository: IUserRepository,
		@inject(TYPES.Services.Storage)
		private readonly _storageService: IStorageService,
	) {}

	async execute(
		input: UpdateArticleCommentInput,
	): Promise<UpdateArticleCommentOutput> {
		const comment = await this._commentRepository.findById(input.commentId);
		if (!comment?.isActive) {
			throw new ArticleCommentNotFoundError();
		}

		if (comment.userId !== input.userId) {
			throw new ArticleCommentOwnershipError("update");
		}

		const updated = await this._commentRepository.updateById(input.commentId, {
			content: input.content,
		});

		if (!updated) {
			throw new ArticleCommentNotFoundError();
		}

		const user = await this._userRepository.findById(input.userId);
		const avatarUrl = user?.profilePictureId
			? this._storageService.getPublicUrl(user.profilePictureId)
			: undefined;

		const authorSnapshot = {
			name: user?.name || "Unknown User",
			avatarUrl,
		};

		return { comment: ArticleCommentMapper.toDto(updated, authorSnapshot) };
	}
}
