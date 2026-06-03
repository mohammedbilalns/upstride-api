export type ArticleForFeed = {
	id: string;
	interests: string[];
	views: number;
	createdAt: Date;
};

export type MentorForFeed = {
	id: string;
	interests: string[];
	rating: number;
	totalSessions: number;
	lastSessionAt?: Date | null;
};
const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

function computeArticleScore(
	article: ArticleForFeed,
	userInterests: string[],
): number {
	const matchCount = article.interests.filter((interest) =>
		userInterests.includes(interest),
	).length;
	const viewScore = Math.log10(article.views + 1) * 2;
	const daySinceCreated =
		(Date.now() - new Date(article.createdAt).getTime()) / ONE_DAY_IN_MS;
	const recentnessBoost = Math.max(0, 10 - daySinceCreated);
	return matchCount * 5 + viewScore + recentnessBoost;
}

function computeMentorScore(mentor: MentorForFeed, userInterests: string[]) {
	const matchCount = mentor.interests.filter((interest) =>
		userInterests.includes(interest),
	).length;
	const ratingScore = mentor.rating * 10;
	const sessionScore = Math.log10(mentor.totalSessions + 1);
	let recentnessBoost = 0;

	if (mentor.lastSessionAt) {
		const daysSinceLastSession =
			(Date.now() - new Date(mentor.lastSessionAt).getTime()) / ONE_DAY_IN_MS;

		recentnessBoost = Math.max(0, 10 - daysSinceLastSession);
	}

	return matchCount * 5 + ratingScore + sessionScore + recentnessBoost;
}

export function computeArticleFeed(
	articles: ArticleForFeed[],
	userInterests: string[],
	limit = 150,
): string[] {
	return articles
		.map((article) => ({
			id: article.id,
			score: computeArticleScore(article, userInterests),
			createdAt: article.createdAt,
		}))
		.sort(
			(a, b) =>
				b.score - a.score ||
				b.createdAt.getTime() - a.createdAt.getTime() ||
				a.id.localeCompare(b.id),
		)
		.slice(0, limit)
		.map((item) => item.id);
}

export function computeMentorFeed(
	mentors: MentorForFeed[],
	userInterests: string[],
	limit = 150,
): string[] {
	return mentors
		.map((mentor) => ({
			id: mentor.id,
			score: computeMentorScore(mentor, userInterests),
			lastSessionAt: mentor.lastSessionAt ?? new Date(0),
		}))
		.sort(
			(a, b) =>
				b.score - a.score ||
				b.lastSessionAt.getTime() - a.lastSessionAt.getTime() ||
				a.id.localeCompare(b.id),
		)
		.slice(0, limit)
		.map((item) => item.id);
}
