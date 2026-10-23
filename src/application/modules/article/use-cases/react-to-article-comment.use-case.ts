import { inject, injectable } from "inversify";
import { ArticleReaction } from "../../../../domain/entities/article-reaction.entity";
import { ArticleCommentReactionCreatedEvent } from "../../../../domain/events/article-comment-reaction-created.event";
import type {
	IArticleCommentRepository,
	IArticleReactionRepository,
	IArticleRepository,
} from "../../../../domain/repositories";
import { TYPES } from "../../../../shared/types/types";
import type { EventBus } from "../../../events/event-bus.interface";
import type {
	ReactToArticleCommentInput,
	ReactToArticleCommentOutput,
} from "../dtos/article-input.dto";
import { ArticleCommentNotFoundError } from "../errors";
import { ArticleReactionMapper } from "../mappers/article-reaction.mapper";
import type { IReactToArticleCommentUseCase } from "./react-to-article-comment.use-case.interface";

@injectable()
export class ReactToArticleCommentUseCase
	implements IReactToArticleCommentUseCase
{
	constructor(
		@inject(TYPES.Repositories.ArticleCommentRepository)
		private readonly _commentRepository: IArticleCommentRepository,
		@inject(TYPES.Repositories.ArticleRepository)
		private readonly _articleRepository: IArticleRepository,
		@inject(TYPES.Repositories.ArticleReactionRepository)
		private readonly _reactionRepository: IArticleReactionRepository,
		@inject(TYPES.Services.EventBus)
		private readonly _eventBus: EventBus,
	) {}

	async execute(
		input: ReactToArticleCommentInput,
	): Promise<ReactToArticleCommentOutput> {
		const comment = await this._commentRepository.findById(input.commentId);
		if (!comment?.isActive) {
			throw new ArticleCommentNotFoundError();
		}

		const article = await this._articleRepository.findById(comment.articleId);
		if (!article?.isActive) {
			throw new ArticleCommentNotFoundError();
		}

		const existing = await this._reactionRepository.query({
			query: { resourceId: input.commentId, userId: input.userId },
		});

		if (existing.length > 0) {
			// Already liked - toggle off
			const current = existing[0];
			await this._reactionRepository.deleteById(current.id);

			await this._commentRepository.updateById(
				comment.id,
				comment.decrementLikes(),
			);

			return { reaction: null };
		}

		// New like
		const reaction = new ArticleReaction(
			"",
			input.commentId,
			input.userId,
			"LIKE",
			null,
		);

		const created = await this._reactionRepository.create(reaction);
		const likeUpdate = comment.incrementLikes();
		await this._commentRepository.updateById(comment.id, likeUpdate);
		const nextLikeCount =
			(likeUpdate.likesCount as number | undefined) ??
			(comment.likesCount ?? 0) + 1;

		await this._eventBus.publish(
			new ArticleCommentReactionCreatedEvent({
				articleId: article.id,
				articleSlug: article.slug,
				articleAuthorId: article.authorId,
				commentId: comment.id,
				reactionType: "LIKE",
				actorId: input.userId,
				actorName: created.actorName || "",
				count: nextLikeCount,
			}),
		);
		return { reaction: ArticleReactionMapper.toDto(created) };
	}
}
