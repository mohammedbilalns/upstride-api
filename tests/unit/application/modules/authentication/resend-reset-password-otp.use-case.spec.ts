import { beforeEach, describe, expect, it } from "vitest";
import type { ResendResetPasswordOtpInput } from "../../../../../src/application/modules/authentication/dtos/otp/resend-reset-password-otp.dto";
import {
	MaxResendsExceededError,
	UserNotFoundError,
} from "../../../../../src/application/modules/authentication/errors";
import { ResendResetPasswordOtpUseCase } from "../../../../../src/application/modules/authentication/use-cases/password-reset/resend-reset-password-otp.use-case";
import type { JobQueuePort } from "../../../../../src/application/ports/job-queue.port";
import type { IOtpGenerator } from "../../../../../src/application/services";
import type {
	IOtpRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("ResendResetPasswordOtpUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let otpRepository: ReturnType<typeof createMock<IOtpRepository>>;
	let otpGeneratorService: ReturnType<typeof createMock<IOtpGenerator>>;
	let jobQueue: ReturnType<typeof createMock<JobQueuePort>>;
	let useCase: ResendResetPasswordOtpUseCase;

	const input: ResendResetPasswordOtpInput = {
		email: "test@example.com",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		otpRepository = createMock<IOtpRepository>();
		otpGeneratorService = createMock<IOtpGenerator>();
		jobQueue = createMock<JobQueuePort>();

		useCase = new ResendResetPasswordOtpUseCase(
			userRepository,
			otpRepository,
			otpGeneratorService,
			jobQueue,
		);
	});

	it("should throw UserNotFoundError when user does not exist", async () => {
		userRepository.findByEmail.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw MaxResendsExceededError when max resends exceeded", async () => {
		const user = createUser({ email: input.email });
		userRepository.findByEmail.mockResolvedValue(user);
		otpRepository.incrementResends.mockResolvedValue(4);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			MaxResendsExceededError,
		);
	});

	it("should reset attempts, generate OTP, save code, and enqueue email", async () => {
		const user = createUser({ email: input.email });
		userRepository.findByEmail.mockResolvedValue(user);
		otpRepository.incrementResends.mockResolvedValue(1);
		otpGeneratorService.generate.mockReturnValue("654321");

		await useCase.execute(input);

		expect(userRepository.findByEmail).toHaveBeenCalledWith(input.email);
		expect(otpRepository.incrementResends).toHaveBeenCalledWith(
			user.id,
			"RESET_PASSWORD",
			180,
		);
		expect(otpRepository.resetAttempts).toHaveBeenCalledWith(
			user.id,
			"RESET_PASSWORD",
		);
		expect(otpGeneratorService.generate).toHaveBeenCalledWith(6);
		expect(otpRepository.saveCode).toHaveBeenCalledWith(
			user.id,
			"RESET_PASSWORD",
			"654321",
			180,
		);
		expect(jobQueue.enqueue).toHaveBeenCalledWith(
			"send-reset-password-otp-email",
			{
				to: user.email,
				otp: "654321",
			},
		);
	});
});
