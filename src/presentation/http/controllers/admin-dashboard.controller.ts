import { inject, injectable } from "inversify";
import type {
	IGetAdminDashboardRevenueAnalyticsUseCase,
	IGetAdminDashboardSessionOverviewUseCase,
	IGetAdminDashboardUseCase,
	IGetAdminDashboardUserGrowthUseCase,
} from "../../../application/modules/admin-dashboard/use-cases";
import { HttpStatus } from "../../../shared/constants/http-status-codes";
import { TYPES } from "../../../shared/types/types";
import type { ValidatedRequest } from "../../../shared/types/validated-request.type";
import { RESPONSE_MESSAGES } from "../constants/response-messages";
import { asyncHandler, sendSuccess } from "../helpers";
import type { AdminDashboardChartQuery } from "../validators/admin-dashboard.validator";

@injectable()
export class AdminDashboardController {
	constructor(
		@inject(TYPES.UseCases.GetAdminDashboard)
		private readonly _getAdminDashboardUseCase: IGetAdminDashboardUseCase,
		@inject(TYPES.UseCases.GetAdminDashboardUserGrowth)
		private readonly _getAdminDashboardUserGrowthUseCase: IGetAdminDashboardUserGrowthUseCase,
		@inject(TYPES.UseCases.GetAdminDashboardRevenueAnalytics)
		private readonly _getAdminDashboardRevenueAnalyticsUseCase: IGetAdminDashboardRevenueAnalyticsUseCase,
		@inject(TYPES.UseCases.GetAdminDashboardSessionOverview)
		private readonly _getAdminDashboardSessionOverviewUseCase: IGetAdminDashboardSessionOverviewUseCase,
	) {}

	getDashboard = asyncHandler(async (_req, res) => {
		const data = await this._getAdminDashboardUseCase.execute();

		sendSuccess(res, HttpStatus.OK, {
			message: RESPONSE_MESSAGES.ADMIN_DASHBOARD.FETCHED_SUCCESS,
			data,
		});
	});

	getUserGrowth = asyncHandler(async (req: ValidatedRequest, res) => {
		const query = req.validated.query as AdminDashboardChartQuery;
		const data = await this._getAdminDashboardUserGrowthUseCase.execute(query);

		sendSuccess(res, HttpStatus.OK, {
			message: RESPONSE_MESSAGES.ADMIN_DASHBOARD.USER_GROWTH_FETCHED_SUCCESS,
			data,
		});
	});

	getRevenueAnalytics = asyncHandler(async (req: ValidatedRequest, res) => {
		const query = req.validated.query as AdminDashboardChartQuery;
		const data =
			await this._getAdminDashboardRevenueAnalyticsUseCase.execute(query);

		sendSuccess(res, HttpStatus.OK, {
			message:
				RESPONSE_MESSAGES.ADMIN_DASHBOARD.REVENUE_ANALYTICS_FETCHED_SUCCESS,
			data,
		});
	});

	getSessionOverview = asyncHandler(async (_req, res) => {
		const data = await this._getAdminDashboardSessionOverviewUseCase.execute();

		sendSuccess(res, HttpStatus.OK, {
			message:
				RESPONSE_MESSAGES.ADMIN_DASHBOARD.SESSION_OVERVIEW_FETCHED_SUCCESS,
			data,
		});
	});
}
