import { beforeEach, describe, expect, it } from "vitest";
import type { VerifyResetPasswordOtpInput } from "../../../../../src/application/modules/authentication/dtos/otp/verify-reset-password-otp.dto";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import { InvalidOtpError } from "../../../../../src/application/modules/authentication/errors/invalid-otp.error";
import { MaxAttemptsExceededError } from "../../../../../src/application/modules/authentication/errors/max-attempts-exceeded.error";
import { VerifyResetPasswordOtpUseCase } from "../../../../../src/application/modules/authentication/use-cases/password-reset/verify-reset-password-otp.use-case";
import type { ITokenService } from "../../../../../src/application/services";
import type {
	IOtpRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("VerifyResetPasswordOtpUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let otpRepository: ReturnType<typeof createMock<IOtpRepository>>;
	let tokenService: ReturnType<typeof createMock<ITokenService>>;
	let useCase: VerifyResetPasswordOtpUseCase;

	const input: VerifyResetPasswordOtpInput = {
		email: "test@example.com",
		otp: "123456",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		otpRepository = createMock<IOtpRepository>();
		tokenService = createMock<ITokenService>();

		useCase = new VerifyResetPasswordOtpUseCase(
			userRepository,
			otpRepository,
			tokenService,
		);
	});

	it("should throw UserNotFoundError when user does not exist", async () => {
		userRepository.findByEmail.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw MaxAttemptsExceededError when max attempts exceeded", async () => {
		const user = createUser({ id: "user-1", email: input.email });
		userRepository.findByEmail.mockResolvedValue(user);
		otpRepository.getAttempts.mockResolvedValue(3);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			MaxAttemptsExceededError,
		);
	});

	it("should throw InvalidOtpError when OTP is invalid", async () => {
		const user = createUser({ id: "user-1", email: input.email });
		userRepository.findByEmail.mockResolvedValue(user);
		otpRepository.getAttempts.mockResolvedValue(0);
		otpRepository.getCode.mockResolvedValue("654321");
		otpRepository.incrementAttempts.mockResolvedValue(1);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			InvalidOtpError,
		);
		expect(otpRepository.incrementAttempts).toHaveBeenCalledWith(
			user.id,
			"RESET_PASSWORD",
			180,
		);
	});

	it("should throw MaxAttemptsExceededError when invalid OTP reaches max attempts", async () => {
		const user = createUser({ id: "user-1", email: input.email });
		userRepository.findByEmail.mockResolvedValue(user);
		otpRepository.getAttempts.mockResolvedValue(2);
		otpRepository.getCode.mockResolvedValue("654321");
		otpRepository.incrementAttempts.mockResolvedValue(3);
		otpRepository.deleteAll.mockResolvedValue(undefined);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			MaxAttemptsExceededError,
		);
		expect(otpRepository.deleteAll).toHaveBeenCalledWith(
			user.id,
			"RESET_PASSWORD",
		);
	});

	it("should return reset token when OTP is valid", async () => {
		const user = createUser({ id: "user-1", email: input.email });
		userRepository.findByEmail.mockResolvedValue(user);
		otpRepository.getAttempts.mockResolvedValue(0);
		otpRepository.getCode.mockResolvedValue(input.otp);
		otpRepository.deleteAll.mockResolvedValue(undefined);
		tokenService.generateResetToken.mockResolvedValue("reset-token-123");

		const result = await useCase.execute(input);

		expect(otpRepository.deleteAll).toHaveBeenCalledWith(
			user.id,
			"RESET_PASSWORD",
		);
		expect(tokenService.generateResetToken).toHaveBeenCalledWith({
			sub: user.id,
		});
		expect(result).toEqual({ resetToken: "reset-token-123" });
	});
});
