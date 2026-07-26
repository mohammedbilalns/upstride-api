import { beforeEach, describe, expect, it } from "vitest";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import { ReportAlreadyExistsError } from "../../../../../src/application/modules/report/errors";
import { ReportUserUseCase } from "../../../../../src/application/modules/report/use-cases/report-user.use-case";
import type {
	IReportRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createReport } from "../../../../factories/entities/report.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("ReportUserUseCase", () => {
	let reportRepository: ReturnType<typeof createMock<IReportRepository>>;
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let useCase: ReportUserUseCase;

	const baseInput = {
		reporterId: "user-1",
		targetUserId: "user-2",
		reason: "Harassment",
		description: "Abusive messages",
	};

	beforeEach(() => {
		reportRepository = createMock<IReportRepository>();
		userRepository = createMock<IUserRepository>();
		useCase = new ReportUserUseCase(reportRepository, userRepository);
	});

	it("should throw when the reporter is not found", async () => {
		userRepository.findById.mockResolvedValueOnce(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw when a pending report already exists", async () => {
		userRepository.findById
			.mockResolvedValueOnce(createUser({ id: "user-1" }))
			.mockResolvedValueOnce(createUser({ id: "user-2" }));
		reportRepository.query.mockResolvedValue([createReport()]);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			ReportAlreadyExistsError,
		);
	});

	it("should create a user report", async () => {
		userRepository.findById
			.mockResolvedValueOnce(createUser({ id: "user-1" }))
			.mockResolvedValueOnce(createUser({ id: "user-2" }));
		reportRepository.query.mockResolvedValue([]);
		reportRepository.create.mockResolvedValue(
			createReport({ targetId: "user-2", targetType: "USER" }),
		);

		const result = await useCase.execute(baseInput);

		expect(reportRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				reporterId: "user-1",
				targetId: "user-2",
				targetType: "USER",
			}),
		);
		expect(result.report.targetType).toBe("USER");
	});
});
