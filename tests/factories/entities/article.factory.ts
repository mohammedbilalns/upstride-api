import { Article } from "../../../src/domain/entities/article.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createArticle(overrides: Partial<Article> = {}): Article {
	const data = mergeDefaults<Article>(
		{
			id: "article-1",
			authorId: "mentor-1",
			authorSnapshot: {
				name: "John Doe",
				interests: ["Backend"],
				avatarUrl: undefined,
				isBlocked: false,
			},
			slug: "test-article",
			featuredImageUrl: "https://example.com/image.png",
			title: "Test Article",
			description: "Test description",
			previewContent: "Preview content",
			tags: ["nestjs", "typescript"],
			isActive: true,
			views: 0,
			commentsCount: 0,
			likesCount: 0,
			isArchived: false,
			isBlockedByAdmin: false,
			blockingReason: null,
			blockedAt: null,
			blockedByReportId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new Article(
		data.id,
		data.authorId,
		data.authorSnapshot,
		data.slug,
		data.featuredImageUrl,
		data.title,
		data.description,
		data.previewContent,
		data.tags,
		data.isActive,
		data.views,
		data.commentsCount,
		data.likesCount,
		data.isArchived,
		data.isBlockedByAdmin,
		data.blockingReason,
		data.blockedAt,
		data.blockedByReportId,
		data.createdAt,
		data.updatedAt,
	);
}
