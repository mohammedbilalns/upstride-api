import { inject, injectable } from "inversify";
import { ArticleReaction } from "../../../../domain/entities/article-reaction.entity";
import { ArticleReactionCreatedEvent } from "../../../../domain/events/article-reaction-created.event";
import type {
	IArticleReactionRepository,
	IArticleRepository,
} from "../../../../domain/repositories";
import { TYPES } from "../../../../shared/types/types";
import type { EventBus } from "../../../events/event-bus.interface";
import type {
	ReactToArticleInput,
	ReactToArticleOutput,
} from "../dtos/article-input.dto";
import { ArticleNotFoundError } from "../errors";
import { ArticleReactionMapper } from "../mappers/article-reaction.mapper";
import type { IReactToArticleUseCase } from "./react-to-article.use-case.interface";

@injectable()
export class ReactToArticleUseCase implements IReactToArticleUseCase {
	constructor(
		@inject(TYPES.Repositories.ArticleRepository)
		private readonly _articleRepository: IArticleRepository,
		@inject(TYPES.Repositories.ArticleReactionRepository)
		private readonly _reactionRepository: IArticleReactionRepository,
		@inject(TYPES.Services.EventBus)
		private readonly _eventBus: EventBus,
	) {}

	async execute(input: ReactToArticleInput): Promise<ReactToArticleOutput> {
		const article = await this._articleRepository.findById(input.articleId);
		if (!article?.isActive) {
			throw new ArticleNotFoundError();
		}

		const existing = await this._reactionRepository.query({
			query: { resourceId: input.articleId, userId: input.userId },
		});

		if (existing.length > 0) {
			// Already liked – toggle off
			const current = existing[0];
			await this._reactionRepository.deleteById(current.id);
			await this._articleRepository.updateById(
				article.id,
				article.decrementLikes(),
			);
			return { reaction: null };
		}

		// New like
		const reaction = new ArticleReaction(
			"",
			input.articleId,
			input.userId,
			"LIKE",
			null,
		);

		const created = await this._reactionRepository.create(reaction);
		const likeUpdate = article.incrementLikes();
		await this._articleRepository.updateById(article.id, likeUpdate);
		const nextLikeCount =
			(likeUpdate.likesCount as number | undefined) ??
			(article.likesCount ?? 0) + 1;

		await this._eventBus.publish(
			new ArticleReactionCreatedEvent({
				articleId: article.id,
				articleSlug: article.slug,
				articleAuthorId: article.authorId,
				reactionType: "LIKE",
				actorId: input.userId,
				actorName: created.actorName || "",
				count: nextLikeCount,
			}),
		);

		return { reaction: ArticleReactionMapper.toDto(created) };
	}
}
