import { inject, injectable } from "inversify";
import { ArticleComment } from "../../../../domain/entities/article-comment.entity";
import { ArticleCommentCreatedEvent } from "../../../../domain/events/article-comment-created.event";
import type {
	IArticleCommentRepository,
	IArticleRepository,
	IUserRepository,
} from "../../../../domain/repositories";
import { TYPES } from "../../../../shared/types/types";
import type { EventBus } from "../../../events/event-bus.interface";
import type { IStorageService } from "../../../services/storage.service.interface";
import type {
	CreateArticleCommentInput,
	CreateArticleCommentOutput,
} from "../dtos/article-input.dto";
import { ArticleCommentNotFoundError, ArticleNotFoundError } from "../errors";
import { ArticleCommentMapper } from "../mappers/article-comment.mapper";
import type { ICreateArticleCommentUseCase } from "./create-article-comment.use-case.interface";

@injectable()
export class CreateArticleCommentUseCase
	implements ICreateArticleCommentUseCase
{
	constructor(
		@inject(TYPES.Repositories.ArticleRepository)
		private readonly _articleRepository: IArticleRepository,
		@inject(TYPES.Repositories.ArticleCommentRepository)
		private readonly _commentRepository: IArticleCommentRepository,
		@inject(TYPES.Repositories.UserRepository)
		private readonly _userRepository: IUserRepository,
		@inject(TYPES.Services.Storage)
		private readonly _storageService: IStorageService,
		@inject(TYPES.Services.EventBus)
		private readonly _eventBus: EventBus,
	) {}

	async execute(
		input: CreateArticleCommentInput,
	): Promise<CreateArticleCommentOutput> {
		const article = await this._articleRepository.findById(input.articleId);
		if (!article?.isActive) {
			throw new ArticleNotFoundError();
		}

		let parentId: string | null = null;
		if (input.parentId !== undefined && input.parentId !== null) {
			const parent = await this._commentRepository.findById(input.parentId);
			if (!parent?.isActive) {
				throw new ArticleCommentNotFoundError("Parent comment not found");
			}
			if (parent.articleId !== input.articleId) {
				throw new ArticleCommentNotFoundError(
					"Parent comment does not belong to this article",
				);
			}
			parentId = parent.id;
		}

		const comment = new ArticleComment(
			"",
			input.articleId,
			parentId,
			input.userId,
			0,
			0,
			input.content,
			true,
			null,
			null,
		);

		const created = await this._commentRepository.create(comment);

		const currentComments = article.commentsCount ?? 0;
		const [, user] = await Promise.all([
			this._articleRepository.updateById(input.articleId, {
				commentsCount: currentComments + 1,
			}),
			this._userRepository.findById(input.userId),
		]);

		if (parentId) {
			let currentParentId: string | null = parentId;
			while (currentParentId) {
				const parentComment =
					await this._commentRepository.findById(currentParentId);
				if (!parentComment) break;

				await this._commentRepository.updateById(currentParentId, {
					repliesCount: (parentComment.repliesCount ?? 0) + 1,
				});
				currentParentId = parentComment.parentId;
			}
		}

		const actorName = user?.name || "";

		await this._eventBus.publish(
			new ArticleCommentCreatedEvent({
				articleId: article.id,
				articleSlug: article.slug,
				articleAuthorId: article.authorId,
				commentId: created.id,
				actorId: input.userId,
				actorName,
				count: currentComments + 1,
				parentId,
			}),
		);

		const avatarUrl = user?.profilePictureId
			? this._storageService.getPublicUrl(user.profilePictureId)
			: undefined;

		const authorSnapshot = {
			name: actorName,
			avatarUrl,
		};

		return { comment: ArticleCommentMapper.toDto(created, authorSnapshot) };
	}
}
