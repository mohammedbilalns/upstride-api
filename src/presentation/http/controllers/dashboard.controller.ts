import { inject, injectable } from "inversify";
import type { IGetDashboardUseCase } from "../../../application/modules/dashboard/use-cases/get-dashboard.use-case.interface";
import type { IGetDashboardActivityOverviewUseCase } from "../../../application/modules/dashboard/use-cases/get-dashboard-activity-overview.use-case.interface";
import { HttpStatus } from "../../../shared/constants/http-status-codes";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { RESPONSE_MESSAGES } from "../constants/response-messages";
import { asyncHandler, sendSuccess } from "../helpers";
import type { DashboardActivityOverviewQuery } from "../validators/dashboard.validator";

@injectable()
export class DashboardController {
	constructor(
		@inject(TYPES.UseCases.GetDashboard)
		private readonly _getDashboardUseCase: IGetDashboardUseCase,
		@inject(TYPES.UseCases.GetDashboardActivityOverview)
		private readonly _getDashboardActivityOverviewUseCase: IGetDashboardActivityOverviewUseCase,
	) {}

	getDashboard = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const data = await this._getDashboardUseCase.execute({
			userId: req.user.id,
			role: req.user.role === "MENTOR" ? "MENTOR" : "USER",
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: RESPONSE_MESSAGES.DASHBOARD.FETCHED_SUCCESS,
			data,
		});
	});

	getActivityOverview = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const query = req.validated.query as DashboardActivityOverviewQuery;
		const data = await this._getDashboardActivityOverviewUseCase.execute({
			userId: req.user.id,
			role: req.user.role === "MENTOR" ? "MENTOR" : "USER",
			period: query.period,
		});

		return sendSuccess(res, HttpStatus.OK, {
			message: RESPONSE_MESSAGES.DASHBOARD.ACTIVITY_OVERVIEW_FETCHED_SUCCESS,
			data,
		});
	});
}
