import { beforeEach, describe, expect, it } from "vitest";
import type { VerifyChangePasswordOtpInput } from "../../../../../src/application/modules/authentication/dtos/otp/verify-change-password-otp.dto";
import {
	InvalidOtpError,
	MaxAttemptsExceededError,
} from "../../../../../src/application/modules/authentication/errors";
import { VerifyChangePasswordOtpUseCase } from "../../../../../src/application/modules/authentication/use-cases/registration/verify-change-password-otp.use-case";
import type { ITokenService } from "../../../../../src/application/services";
import { UserNotFoundError } from "../../../../../src/application/shared/errors/user-not-found.error";
import type {
	IOtpRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("VerifyChangePasswordOtpUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let otpRepository: ReturnType<typeof createMock<IOtpRepository>>;
	let tokenService: ReturnType<typeof createMock<ITokenService>>;
	let useCase: VerifyChangePasswordOtpUseCase;

	const input: VerifyChangePasswordOtpInput = {
		userId: "user-1",
		otp: "123456",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		otpRepository = createMock<IOtpRepository>();
		tokenService = createMock<ITokenService>();

		useCase = new VerifyChangePasswordOtpUseCase(
			userRepository,
			otpRepository,
			tokenService,
		);
	});

	it("should throw UserNotFoundError when the user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw MaxAttemptsExceededError when attempts are already maxed", async () => {
		userRepository.findById.mockResolvedValue(createUser({ id: input.userId }));
		otpRepository.getAttempts.mockResolvedValue(3);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			MaxAttemptsExceededError,
		);

		expect(otpRepository.getCode).not.toHaveBeenCalled();
	});

	it("should throw InvalidOtpError and increment attempts for an invalid code", async () => {
		userRepository.findById.mockResolvedValue(createUser({ id: input.userId }));
		otpRepository.getAttempts.mockResolvedValue(0);
		otpRepository.getCode.mockResolvedValue("654321");
		otpRepository.incrementAttempts.mockResolvedValue(1);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			InvalidOtpError,
		);

		expect(otpRepository.incrementAttempts).toHaveBeenCalledWith(
			input.userId,
			"CHANGE_PASSWORD",
			300,
		);
		expect(otpRepository.deleteAll).not.toHaveBeenCalled();
	});

	it("should delete otp data and throw MaxAttemptsExceededError when final attempt fails", async () => {
		userRepository.findById.mockResolvedValue(createUser({ id: input.userId }));
		otpRepository.getAttempts.mockResolvedValue(2);
		otpRepository.getCode.mockResolvedValue("654321");
		otpRepository.incrementAttempts.mockResolvedValue(3);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			MaxAttemptsExceededError,
		);

		expect(otpRepository.deleteAll).toHaveBeenCalledWith(
			input.userId,
			"CHANGE_PASSWORD",
		);
	});

	it("should return a reset token when the otp is valid", async () => {
		userRepository.findById.mockResolvedValue(createUser({ id: input.userId }));
		otpRepository.getAttempts.mockResolvedValue(0);
		otpRepository.getCode.mockResolvedValue(input.otp);
		otpRepository.deleteAll.mockResolvedValue(undefined);
		tokenService.generateResetToken.mockResolvedValue("reset-token");

		const result = await useCase.execute(input);

		expect(result).toEqual({ resetToken: "reset-token" });
		expect(tokenService.generateResetToken).toHaveBeenCalledWith({
			sub: input.userId,
		});
		expect(otpRepository.deleteAll).toHaveBeenCalledWith(
			input.userId,
			"CHANGE_PASSWORD",
		);
	});
});
