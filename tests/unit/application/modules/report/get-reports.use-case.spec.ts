import { beforeEach, describe, expect, it } from "vitest";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import { AdminOnlyReportActionError } from "../../../../../src/application/modules/report/errors";
import { GetReportsUseCase } from "../../../../../src/application/modules/report/use-cases/get-reports.use-case";
import type {
	IReportRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createReport } from "../../../../factories/entities/report.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetReportsUseCase", () => {
	let reportRepository: ReturnType<typeof createMock<IReportRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let useCase: GetReportsUseCase;

	beforeEach(() => {
		reportRepository = createMock<IReportRepository>();
		userRepository = createMock<IUserRepository>();
		useCase = new GetReportsUseCase(reportRepository, userRepository);
	});

	it("should throw when the admin user is not found", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({ adminId: "admin-1" }),
		).rejects.toBeInstanceOf(UserNotFoundError);
	});

	it("should throw when the user is not an admin", async () => {
		userRepository.findById.mockResolvedValue(createUser({ role: "USER" }));

		await expect(
			useCase.execute({ adminId: "admin-1" }),
		).rejects.toBeInstanceOf(AdminOnlyReportActionError);
	});

	it("should paginate reports and include stats", async () => {
		userRepository.findById.mockResolvedValue(createUser({ role: "ADMIN" }));
		reportRepository.paginate.mockResolvedValue({
			items: [createReport()],
			total: 1,
			page: 2,
			limit: 15,
			totalPages: 1,
		});
		reportRepository.getStats.mockResolvedValue({
			totalReports: 5,
			pendingReports: 2,
			appealedReports: 1,
		});

		const result = await useCase.execute({
			adminId: "admin-1",
			page: 2,
			limit: 15,
			status: "PENDING",
			targetType: "ARTICLE",
		});

		expect(reportRepository.paginate).toHaveBeenCalledWith({
			page: 2,
			limit: 15,
			query: { status: "PENDING", targetType: "ARTICLE" },
			sort: { createdAt: -1 },
		});
		expect(result.totalReports).toBe(5);
		expect(result.reports).toHaveLength(1);
	});
});
