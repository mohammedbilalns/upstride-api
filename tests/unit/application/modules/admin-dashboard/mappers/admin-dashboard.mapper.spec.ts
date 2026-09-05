import { describe, expect, it } from "vitest";
import { AdminDashboardMapper } from "../../../../../../src/application/modules/admin-dashboard/mappers/admin-dashboard.mapper";

describe("AdminDashboardMapper", () => {
	describe("toMetricDto", () => {
		it("should map stats correctly", () => {
			const result = AdminDashboardMapper.toMetricDto({
				total: 100,
				current: 30,
				previous: 20,
			});

			expect(result).toEqual({
				total: 100,
				current: 30,
				previous: 20,
				changePercent: 50,
			});
		});
	});

	describe("toTopMentorDto", () => {
		it("should map top mentor correctly", () => {
			const result = AdminDashboardMapper.toTopMentorDto({
				mentorId: "mentor-1",
				name: "Mentor Name",
				currentRevenue: 100,
				previousRevenue: 80,
			});

			expect(result).toEqual({
				mentorId: "mentor-1",
				name: "Mentor Name",
				revenue: 100,
				changePercent: 25,
			});
		});
	});
});
