import { beforeEach, describe, expect, it } from "vitest";
import type { EventBus } from "../../../../../src/application/events/event-bus.interface";
import { ArticleNotFoundError } from "../../../../../src/application/modules/article/errors";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import { AdminOnlyReportActionError } from "../../../../../src/application/modules/report/errors";
import { BlockArticleUseCase } from "../../../../../src/application/modules/report/use-cases/block-article.use-case";
import type {
	IArticleRepository,
	IReportRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createArticle } from "../../../../factories/entities/article.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("BlockArticleUseCase", () => {
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let reportRepository: ReturnType<typeof createMock<IReportRepository>>;
	let eventBus: ReturnType<typeof createMock<EventBus>>;
	let useCase: BlockArticleUseCase;

	beforeEach(() => {
		articleRepository = createMock<IArticleRepository>();
		userRepository = createMock<IUserRepository>();
		reportRepository = createMock<IReportRepository>();
		eventBus = createMock<EventBus>();
		useCase = new BlockArticleUseCase(
			articleRepository,
			userRepository,
			reportRepository,
			eventBus,
		);
	});

	it("should throw when the admin user is not found", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({
				adminId: "admin-1",
				articleId: "article-1",
				reason: "Spam",
			}),
		).rejects.toBeInstanceOf(UserNotFoundError);
	});

	it("should throw when the actor is not an admin", async () => {
		userRepository.findById.mockResolvedValue(createUser({ role: "USER" }));

		await expect(
			useCase.execute({
				adminId: "admin-1",
				articleId: "article-1",
				reason: "Spam",
			}),
		).rejects.toBeInstanceOf(AdminOnlyReportActionError);
	});

	it("should throw when the article does not exist", async () => {
		userRepository.findById.mockResolvedValue(createUser({ role: "ADMIN" }));
		articleRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({
				adminId: "admin-1",
				articleId: "article-1",
				reason: "Spam",
			}),
		).rejects.toBeInstanceOf(ArticleNotFoundError);
	});

	it("should block the article, publish the event, and resolve the report", async () => {
		const article = createArticle();
		const blockedArticle = createArticle({
			isBlockedByAdmin: true,
			blockingReason: "Spam",
			blockedByReportId: "report-1",
		});
		userRepository.findById.mockResolvedValue(createUser({ role: "ADMIN" }));
		articleRepository.findById.mockResolvedValue(article);
		articleRepository.updateById.mockResolvedValue(blockedArticle);

		const result = await useCase.execute({
			adminId: "admin-1",
			articleId: "article-1",
			reason: "Spam",
			reportId: "report-1",
		});

		expect(articleRepository.updateById).toHaveBeenCalledWith(
			"article-1",
			expect.objectContaining({
				isBlockedByAdmin: true,
				blockingReason: "Spam",
				blockedByReportId: "report-1",
			}),
		);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					articleId: "article-1",
					authorId: "mentor-1",
					reason: "Spam",
				}),
			}),
		);
		expect(reportRepository.updateById).toHaveBeenCalledWith(
			"report-1",
			expect.objectContaining({
				status: "RESOLVED",
				actionTaken: "Blocked article: Spam",
				actionTakenAt: expect.any(Date),
			}),
		);
		expect(result.resourceId).toBe("article-1");
	});
});
