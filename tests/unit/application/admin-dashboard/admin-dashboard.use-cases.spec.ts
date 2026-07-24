import { beforeEach, describe, expect, it } from "vitest";
import { GetAdminDashboardUseCase } from "../../../../src/application/modules/admin-dashboard/use-cases/get-admin-dashboard.use-case";
import { GetAdminDashboardRevenueAnalyticsUseCase } from "../../../../src/application/modules/admin-dashboard/use-cases/get-admin-dashboard-revenue-analytics.use-case";
import { GetAdminDashboardSessionOverviewUseCase } from "../../../../src/application/modules/admin-dashboard/use-cases/get-admin-dashboard-session-overview.use-case";
import { GetAdminDashboardUserGrowthUseCase } from "../../../../src/application/modules/admin-dashboard/use-cases/get-admin-dashboard-user-growth.use-case";
import type { IAdminDashboardRepository } from "../../../../src/domain/repositories/admin-dashboard.repository.interface";
import { createMock } from "../../../factories/utilities/create-mock";

describe("admin dashboard use cases", () => {
	let adminDashboardRepository: ReturnType<
		typeof createMock<IAdminDashboardRepository>
	>;

	beforeEach(() => {
		adminDashboardRepository = createMock<IAdminDashboardRepository>();
	});

	it("maps the admin dashboard summary", async () => {
		const useCase = new GetAdminDashboardUseCase(adminDashboardRepository);
		adminDashboardRepository.getSummary.mockResolvedValue({
			metrics: {
				totalUsers: { total: 100, current: 20, previous: 10 },
				totalMentors: { total: 20, current: 5, previous: 4 },
				totalSessions: { total: 40, current: 12, previous: 6 },
				totalRevenue: { total: 8000, current: 2000, previous: 1000 },
			},
			topMentors: [
				{
					mentorId: "mentor-1",
					name: "Alice",
					currentRevenue: 400,
					previousRevenue: 200,
				},
			],
			topCategories: [
				{
					categoryId: "cat-1",
					name: "Backend",
					sessions: 10,
					sharePercent: 60,
				},
			],
			systemHealth: {
				status: "ok",
				timestamp: "2026-07-24T00:00:00.000Z",
				uptimeSeconds: 100,
				dependencies: {
					mongo: { status: "up", latencyMs: 12 },
					redis: { status: "up", latencyMs: 8 },
				},
				services: {
					notificationQueue: { status: "up", latencyMs: 5 },
				},
			},
		});

		const result = await useCase.execute();

		expect(result.metrics.totalUsers.changePercent).toBe(100);
		expect(result.metrics.totalRevenue.changePercent).toBe(100);
		expect(result.topMentors[0]).toEqual(
			expect.objectContaining({
				mentorId: "mentor-1",
				revenue: 400,
				changePercent: 100,
			}),
		);
	});

	it("maps user growth analytics", async () => {
		const useCase = new GetAdminDashboardUserGrowthUseCase(
			adminDashboardRepository,
		);
		adminDashboardRepository.getUserGrowth.mockResolvedValue({
			period: "month",
			labels: ["Week 1"],
			series: [{ label: "Week 1", users: 4, mentors: 1 }],
		});

		const result = await useCase.execute({ period: "month" });

		expect(adminDashboardRepository.getUserGrowth).toHaveBeenCalledWith({
			period: "month",
		});
		expect(result.series).toEqual([{ label: "Week 1", users: 4, mentors: 1 }]);
	});

	it("maps revenue analytics", async () => {
		const useCase = new GetAdminDashboardRevenueAnalyticsUseCase(
			adminDashboardRepository,
		);
		adminDashboardRepository.getRevenueAnalytics.mockResolvedValue({
			period: "week",
			labels: ["Mon"],
			series: [{ label: "Mon", value: 120 }],
			breakdown: {
				effectiveRevenue: 80,
				platformWalletBalance: 20,
				upcomingSessionLiability: 10,
			},
		});

		const result = await useCase.execute({ period: "week" });

		expect(result.breakdown.effectiveRevenue).toBe(80);
		expect(result.series).toEqual([{ label: "Mon", value: 120 }]);
	});

	it("maps session overview rates", async () => {
		const useCase = new GetAdminDashboardSessionOverviewUseCase(
			adminDashboardRepository,
		);
		adminDashboardRepository.getSessionOverview.mockResolvedValue({
			totalSessions: 20,
			completed: 15,
			upcoming: 2,
			cancelled: 3,
		});

		const result = await useCase.execute();

		expect(result.completionRate).toBe(75);
		expect(result.cancellationRate).toBe(15);
	});
});
