import { ArticleView } from "../../../src/domain/entities/article-view.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createArticleView(
	overrides: Partial<ArticleView> = {},
): ArticleView {
	const data = mergeDefaults<ArticleView>(
		{
			id: "article-view-1",
			articleId: "article-1",
			userId: "user-1",
		},
		overrides,
	);

	return new ArticleView(data.id, data.articleId, data.userId);
}
