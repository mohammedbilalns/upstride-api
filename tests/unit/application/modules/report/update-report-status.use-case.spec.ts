import { beforeEach, describe, expect, it } from "vitest";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import type { ICreateNotificationUseCase } from "../../../../../src/application/modules/notification/use-cases";
import {
	AdminOnlyReportActionError,
	ReportNotFoundError,
} from "../../../../../src/application/modules/report/errors";
import { UpdateReportStatusUseCase } from "../../../../../src/application/modules/report/use-cases/update-report-status.use-case";
import type {
	IReportRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createReport } from "../../../../factories/entities/report.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("UpdateReportStatusUseCase", () => {
	let reportRepository: ReturnType<typeof createMock<IReportRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let createNotificationUseCase: ReturnType<
		typeof createMock<ICreateNotificationUseCase>
	>;
	let useCase: UpdateReportStatusUseCase;

	beforeEach(() => {
		reportRepository = createMock<IReportRepository>();
		userRepository = createMock<IUserRepository>();
		createNotificationUseCase = createMock<ICreateNotificationUseCase>();
		useCase = new UpdateReportStatusUseCase(
			reportRepository,
			userRepository,
			createNotificationUseCase,
		);
	});

	it("should throw when the admin user is not found", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({
				adminId: "admin-1",
				reportId: "report-1",
				status: "RESOLVED",
			}),
		).rejects.toBeInstanceOf(UserNotFoundError);
	});

	it("should throw when the user is not an admin", async () => {
		userRepository.findById.mockResolvedValue(createUser({ role: "USER" }));

		await expect(
			useCase.execute({
				adminId: "admin-1",
				reportId: "report-1",
				status: "RESOLVED",
			}),
		).rejects.toBeInstanceOf(AdminOnlyReportActionError);
	});

	it("should throw when the report does not exist", async () => {
		userRepository.findById.mockResolvedValue(createUser({ role: "ADMIN" }));
		reportRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({
				adminId: "admin-1",
				reportId: "report-1",
				status: "RESOLVED",
			}),
		).rejects.toBeInstanceOf(ReportNotFoundError);
	});

	it("should update the report status and notify the reporter", async () => {
		userRepository.findById.mockResolvedValue(
			createUser({ id: "admin-1", role: "ADMIN" }),
		);
		reportRepository.findById.mockResolvedValue(
			createReport({ id: "report-1", reporterId: "user-1", status: "PENDING" }),
		);
		reportRepository.updateById.mockResolvedValue(
			createReport({
				id: "report-1",
				reporterId: "user-1",
				status: "RESOLVED",
				actionTaken: "Blocked",
			}),
		);

		const result = await useCase.execute({
			adminId: "admin-1",
			reportId: "report-1",
			status: "RESOLVED",
			actionTaken: "Blocked",
		});

		expect(reportRepository.updateById).toHaveBeenCalledWith(
			"report-1",
			expect.objectContaining({
				status: "RESOLVED",
				actionTaken: "Blocked",
				actionTakenAt: expect.any(Date),
			}),
		);
		expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				event: "REPORT_STATUS_UPDATED",
			}),
		);
		expect(result.report.status).toBe("RESOLVED");
	});
});
