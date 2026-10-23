import { inject, injectable } from "inversify";
import type { IUnblockArticleUseCase } from "../../../application/modules/article/use-cases";
import type {
	IBlockArticleUseCase,
	IGetReportsUseCase,
	IReportArticleUseCase,
	IReportUserUseCase,
	IUpdateReportStatusUseCase,
} from "../../../application/modules/report/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { ReportResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	BlockArticleBody,
	BlockArticleParam,
	GetReportsQuery,
	ReportArticleParam,
	ReportBody,
	ReportIdParam,
	ReportUserParam,
	UpdateReportStatusBody,
} from "../validators/report.validator";

@injectable()
export class ReportController {
	constructor(
		@inject(TYPES.UseCases.ReportArticle)
		private readonly _reportArticleUseCase: IReportArticleUseCase,
		@inject(TYPES.UseCases.ReportUser)
		private readonly _reportUserUseCase: IReportUserUseCase,
		@inject(TYPES.UseCases.GetReports)
		private readonly _getReportsUseCase: IGetReportsUseCase,
		@inject(TYPES.UseCases.UpdateReportStatus)
		private readonly _updateReportStatusUseCase: IUpdateReportStatusUseCase,
		@inject(TYPES.UseCases.BlockArticle)
		private readonly _blockArticleUseCase: IBlockArticleUseCase,
		@inject(TYPES.UseCases.UnblockArticle)
		private readonly _unblockArticleUseCase: IUnblockArticleUseCase,
	) {}

	reportArticle = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._reportArticleUseCase.execute({
			reporterId: req.user.id,
			...(req.validated.params as ReportArticleParam),
			...(req.validated.body as ReportBody),
		});

		return sendSuccess(res, HttpStatus.CREATED, {
			message: ReportResponseMessages.REPORT_SUBMITTED_SUCCESS,
			data: result,
		});
	});

	reportUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._reportUserUseCase.execute({
			reporterId: req.user.id,
			targetUserId: (req.validated.params as ReportUserParam).userId,
			...(req.validated.body as ReportBody),
		});

		return sendSuccess(res, HttpStatus.CREATED, {
			message: ReportResponseMessages.REPORT_SUBMITTED_SUCCESS,
			data: result,
		});
	});

	getReports = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._getReportsUseCase.execute({
			adminId: req.user.id,
			...(req.validated.query as GetReportsQuery),
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: ReportResponseMessages.REPORTS_FETCHED_SUCCESS,
			data: result,
		});
	});

	updateStatus = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._updateReportStatusUseCase.execute({
			adminId: req.user.id,
			...(req.validated.params as ReportIdParam),
			...(req.validated.body as UpdateReportStatusBody),
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: ReportResponseMessages.REPORT_STATUS_UPDATED_SUCCESS,
			data: result,
		});
	});

	blockArticle = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._blockArticleUseCase.execute({
			...(req.validated.params as BlockArticleParam),
			adminId: req.user.id,
			...(req.validated.body as BlockArticleBody),
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: ReportResponseMessages.ARTICLE_BLOCKED_SUCCESS,
			data: result,
		});
	});

	unblockArticle = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const result = await this._unblockArticleUseCase.execute({
			adminId: req.user.id,
			...(req.validated.params as BlockArticleParam),
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: ReportResponseMessages.ARTICLE_UNBLOCKED_SUCCESS,
			data: result,
		});
	});
}
