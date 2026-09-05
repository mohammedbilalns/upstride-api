import { describe, expect, it } from "vitest";
import { Report } from "../../../../src/domain/entities/report.entity";

describe("Report Entity", () => {
	describe("assertCanReport static method", () => {
		it("should allow USER to report different user", () => {
			expect(() => Report.assertCanReport("USER", "u1", "u2")).not.toThrow();
		});

		it("should allow MENTOR to report different user", () => {
			expect(() => Report.assertCanReport("MENTOR", "m1", "u2")).not.toThrow();
		});

		it("should throw when ADMIN tries to report", () => {
			expect(() => Report.assertCanReport("ADMIN", "a1", "u1")).toThrow();
		});

		it("should throw when SUPER_ADMIN tries to report", () => {
			expect(() =>
				Report.assertCanReport("SUPER_ADMIN", "sa1", "u1"),
			).toThrow();
		});

		it("should throw when USER reports self", () => {
			expect(() => Report.assertCanReport("USER", "u1", "u1")).toThrow();
		});

		it("should throw when MENTOR reports self", () => {
			expect(() => Report.assertCanReport("MENTOR", "m1", "m1")).toThrow();
		});
	});

	describe("updateStatus instance method", () => {
		it("should update to RESOLVED with action", () => {
			const now = new Date();
			const report = new Report(
				"r1",
				"u1",
				"article1",
				"ARTICLE",
				"Bad",
				"Desc",
				"PENDING",
				"",
				now,
				now,
			);

			const result = report.updateStatus("RESOLVED", "Removed");
			expect(result.status).toBe("RESOLVED");
			expect(result.actionTaken).toBe("Removed");
			expect(result.actionTakenAt).toBeInstanceOf(Date);
		});

		it("should update to REJECTED without action", () => {
			const now = new Date();
			const report = new Report(
				"r1",
				"u1",
				"article1",
				"ARTICLE",
				"Bad",
				"Desc",
				"PENDING",
				"",
				now,
				now,
			);

			const result = report.updateStatus("REJECTED");
			expect(result.status).toBe("REJECTED");
		});

		it("should update to CLOSED", () => {
			const now = new Date();
			const report = new Report(
				"r1",
				"u1",
				"article1",
				"ARTICLE",
				"Bad",
				"Desc",
				"RESOLVED",
				"Removed",
				now,
				now,
				now,
			);

			const result = report.updateStatus("CLOSED");
			expect(result.status).toBe("CLOSED");
		});
	});

	describe("constructor", () => {
		it("should allow all report statuses", () => {
			const now = new Date();
			const statuses: Array<"PENDING" | "RESOLVED" | "REJECTED" | "CLOSED"> = [
				"PENDING",
				"RESOLVED",
				"REJECTED",
				"CLOSED",
			];

			statuses.forEach((status) => {
				const report = new Report(
					"r1",
					"u1",
					"t1",
					"ARTICLE",
					"Reason",
					"Desc",
					status,
					"",
					now,
					now,
				);
				expect(report.status).toBe(status);
			});
		});

		it("should allow both target types", () => {
			const now = new Date();
			const report1 = new Report(
				"r1",
				"u1",
				"article1",
				"ARTICLE",
				"Bad",
				"Desc",
				"PENDING",
				"",
				now,
				now,
			);
			const report2 = new Report(
				"r2",
				"u1",
				"user2",
				"USER",
				"Bad",
				"Desc",
				"PENDING",
				"",
				now,
				now,
			);

			expect(report1.targetType).toBe("ARTICLE");
			expect(report2.targetType).toBe("USER");
		});
	});
});
