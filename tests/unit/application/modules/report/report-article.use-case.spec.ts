import { beforeEach, describe, expect, it } from "vitest";
import { ArticleNotFoundError } from "../../../../../src/application/modules/article/errors";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import { ReportAlreadyExistsError } from "../../../../../src/application/modules/report/errors";
import { ReportArticleUseCase } from "../../../../../src/application/modules/report/use-cases/report-article.use-case";
import type {
	IArticleRepository,
	IReportRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createArticle } from "../../../../factories/entities/article.factory";
import { createReport } from "../../../../factories/entities/report.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("ReportArticleUseCase", () => {
	let reportRepository: ReturnType<typeof createMock<IReportRepository>>;
	let articleRepository: ReturnType<typeof createMock<IArticleRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let useCase: ReportArticleUseCase;

	const baseInput = {
		reporterId: "user-1",
		articleId: "article-1",
		reason: "Spam",
		description: "Spam content",
	};

	beforeEach(() => {
		reportRepository = createMock<IReportRepository>();
		articleRepository = createMock<IArticleRepository>();
		userRepository = createMock<IUserRepository>();
		useCase = new ReportArticleUseCase(
			reportRepository,
			articleRepository,
			userRepository,
		);
	});

	it("should throw when the reporter is not found", async () => {
		userRepository.findById.mockResolvedValue(null);
		articleRepository.findById.mockResolvedValue(createArticle());

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw when the article is not active", async () => {
		userRepository.findById.mockResolvedValue(createUser());
		articleRepository.findById.mockResolvedValue(
			createArticle({ isActive: false }),
		);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ArticleNotFoundError,
		);
	});

	it("should throw when a pending article report already exists", async () => {
		userRepository.findById.mockResolvedValue(createUser());
		articleRepository.findById.mockResolvedValue(createArticle());
		reportRepository.query.mockResolvedValue([createReport()]);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ReportAlreadyExistsError,
		);
	});

	it("should create an article report", async () => {
		userRepository.findById.mockResolvedValue(createUser());
		articleRepository.findById.mockResolvedValue(createArticle());
		reportRepository.query.mockResolvedValue([]);
		reportRepository.create.mockResolvedValue(createReport());

		const result = await useCase.execute(baseInput);

		expect(reportRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				reporterId: "user-1",
				targetId: "article-1",
				targetType: "ARTICLE",
			}),
		);
		expect(result.report.targetId).toBe("article-1");
	});
});
