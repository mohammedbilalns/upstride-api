import { ArticleReaction } from "../../../src/domain/entities/article-reaction.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createArticleReaction(
	overrides: Partial<ArticleReaction> = {},
): ArticleReaction {
	const data = mergeDefaults(
		{
			id: "reaction-1",
			resourceId: "article-1",
			userId: "user-1",
			reactionType: "LIKE",
			createdAt: new Date(),
			actorName: "Test User",
		},
		overrides,
	);

	return new ArticleReaction(
		data.id,
		data.resourceId,
		data.userId,
		data.reactionType,
		data.createdAt,
		data.actorName,
	);
}
