import { inject, injectable } from "inversify";
import { Report } from "../../../../domain/entities/report.entity";
import type {
	IArticleRepository,
	IReportRepository,
	IUserRepository,
} from "../../../../domain/repositories";
import { TYPES } from "../../../../shared/types/types";
import { ArticleNotFoundError } from "../../article/errors";
import { UserNotFoundError } from "../../authentication/errors";
import type {
	ReportArticleInput,
	ReportArticleOutput,
} from "../dtos/report.dto";
import { ReportAlreadyExistsError } from "../errors";
import { ReportMapper } from "../mappers/report.mapper";
import type { IReportArticleUseCase } from "./report-article.use-case.interface";

@injectable()
export class ReportArticleUseCase implements IReportArticleUseCase {
	constructor(
		@inject(TYPES.Repositories.ReportRepository)
		private readonly _reportRepository: IReportRepository,
		@inject(TYPES.Repositories.ArticleRepository)
		private readonly _articleRepository: IArticleRepository,
		@inject(TYPES.Repositories.UserRepository)
		private readonly _userRepository: IUserRepository,
	) {}

	async execute(input: ReportArticleInput): Promise<ReportArticleOutput> {
		const [reporter, article] = await Promise.all([
			this._userRepository.findById(input.reporterId),
			this._articleRepository.findById(input.articleId),
		]);

		if (!reporter) {
			throw new UserNotFoundError();
		}

		if (!article?.isActive || article.isArchived) {
			throw new ArticleNotFoundError();
		}

		Report.assertCanReport(reporter.role, reporter.id, article.authorId);
		const existingReports = await this._reportRepository.query({
			query: {
				targetId: input.articleId,
				reporterId: input.reporterId,
				status: "PENDING",
			},
		});

		if (existingReports.length > 0) {
			throw new ReportAlreadyExistsError("article");
		}

		const report = new Report(
			"",
			input.reporterId,
			input.articleId,
			"ARTICLE",
			input.reason,
			input.description,
			"PENDING",
			"",
			null,
			null,
		);

		const created = await this._reportRepository.create(report);

		return { report: ReportMapper.toDto(created) };
	}
}
