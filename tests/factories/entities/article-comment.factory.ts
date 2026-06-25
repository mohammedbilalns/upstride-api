import { ArticleComment } from "../../../src/domain/entities/article-comment.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createArticleComment(
	overrides: Partial<ArticleComment> = {},
): ArticleComment {
	const data = mergeDefaults(
		{
			id: "comment-1",
			articleId: "article-1",
			parentId: null,
			userId: "user-1",
			likesCount: 0,
			repliesCount: 0,
			content: "This is a test comment.",
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new ArticleComment(
		data.id,
		data.articleId,
		data.parentId,
		data.userId,
		data.likesCount,
		data.repliesCount,
		data.content,
		data.isActive,
		data.createdAt,
		data.updatedAt,
	);
}
