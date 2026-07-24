import { beforeEach, describe, expect, it } from "vitest";
import {
	InvalidPasswordError,
	MaxResendsExceededError,
	UserNotFoundError,
} from "../../../../../src/application/modules/authentication/errors";
import { RequestChangePasswordUseCase } from "../../../../../src/application/modules/profile/use-cases/request-change-password.use-case";
import type { JobQueuePort } from "../../../../../src/application/ports/job-queue.port";
import type { IOtpGenerator } from "../../../../../src/application/services";
import type { IPasswordService } from "../../../../../src/application/services/password.service.interface";
import type { IUserRepository } from "../../../../../src/domain/repositories";
import type { IOtpRepository } from "../../../../../src/domain/repositories/otp.repository.interface";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("RequestChangePasswordUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let otpRepository: ReturnType<typeof createMock<IOtpRepository>>;
	let otpGenerator: ReturnType<typeof createMock<IOtpGenerator>>;
	let jobQueue: ReturnType<typeof createMock<JobQueuePort>>;
	let passwordService: ReturnType<typeof createMock<IPasswordService>>;
	let useCase: RequestChangePasswordUseCase;

	const baseInput = {
		userId: "user-1",
		oldPassword: "old-password",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		otpRepository = createMock<IOtpRepository>();
		otpGenerator = createMock<IOtpGenerator>();
		jobQueue = createMock<JobQueuePort>();
		passwordService = createMock<IPasswordService>();
		useCase = new RequestChangePasswordUseCase(
			userRepository,
			otpRepository,
			otpGenerator,
			jobQueue,
			passwordService,
		);
	});

	it("should throw when the user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw when the old password is invalid", async () => {
		userRepository.findById.mockResolvedValue(createUser());
		passwordService.verifyPassword.mockResolvedValue(false);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			InvalidPasswordError,
		);
	});

	it("should throw when max resend attempts are exceeded", async () => {
		userRepository.findById.mockResolvedValue(createUser());
		passwordService.verifyPassword.mockResolvedValue(true);
		otpRepository.incrementResends.mockResolvedValue(999);

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			MaxResendsExceededError,
		);
	});

	it("should save the otp and enqueue the email job", async () => {
		userRepository.findById.mockResolvedValue(createUser());
		passwordService.verifyPassword.mockResolvedValue(true);
		otpRepository.incrementResends.mockResolvedValue(1);
		otpGenerator.generate.mockReturnValue("123456");

		await useCase.execute(baseInput);

		expect(otpRepository.resetAttempts).toHaveBeenCalled();
		expect(otpRepository.saveCode).toHaveBeenCalledWith(
			"user-1",
			"CHANGE_PASSWORD",
			"123456",
			expect.any(Number),
		);
		expect(jobQueue.enqueue).toHaveBeenCalledWith(
			"send-change-password-otp-email",
			expect.objectContaining({
				to: "test@example.com",
				otp: "123456",
			}),
		);
	});
});
