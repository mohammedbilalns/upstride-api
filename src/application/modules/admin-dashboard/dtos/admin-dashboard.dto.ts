import type { AdminDashboardPeriod } from "../../../../domain/repositories/admin-dashboard.repository.interface";
import type { SystemHealthSnapshot } from "../../../../shared/utilities/health-check.util";

export interface AdminDashboardMetricDto {
	total: number;
	current: number;
	previous: number;
	changePercent: number;
}

export interface AdminDashboardUserGrowthPointDto {
	label: string;
	users: number;
	mentors: number;
}

export interface AdminDashboardUserGrowthDto {
	period: AdminDashboardPeriod;
	labels: string[];
	series: AdminDashboardUserGrowthPointDto[];
}

export interface AdminDashboardRevenuePointDto {
	label: string;
	value: number;
}

export interface AdminDashboardRevenueBreakdownDto {
	effectiveRevenue: number;
	platformWalletBalance: number;
	upcomingSessionLiability: number;
}

export interface AdminDashboardRevenueAnalyticsDto {
	period: AdminDashboardPeriod;
	labels: string[];
	series: AdminDashboardRevenuePointDto[];
	breakdown: AdminDashboardRevenueBreakdownDto;
}

export interface AdminDashboardSessionOverviewDto {
	totalSessions: number;
	completed: number;
	upcoming: number;
	cancelled: number;
	completionRate: number;
	cancellationRate: number;
}

export interface AdminDashboardTopMentorDto {
	mentorId: string;
	name: string;
	revenue: number;
	changePercent: number;
}

export interface AdminDashboardTopCategoryDto {
	categoryId: string;
	name: string;
	sessions: number;
	sharePercent: number;
}

export interface AdminDashboardSummaryDto {
	metrics: {
		totalUsers: AdminDashboardMetricDto;
		totalMentors: AdminDashboardMetricDto;
		totalSessions: AdminDashboardMetricDto;
		totalRevenue: AdminDashboardMetricDto;
	};
	topMentors: AdminDashboardTopMentorDto[];
	topCategories: AdminDashboardTopCategoryDto[];
	systemHealth: SystemHealthSnapshot;
}

export interface AdminDashboardChartInput {
	period: AdminDashboardPeriod;
	startDate?: string;
	endDate?: string;
}
