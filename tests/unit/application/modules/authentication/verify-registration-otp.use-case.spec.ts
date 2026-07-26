import { beforeEach, describe, expect, it } from "vitest";
import type { EventBus } from "../../../../../src/application/events/event-bus.interface";
import type { VerifyRegistrationOtpInput } from "../../../../../src/application/modules/authentication/dtos/otp/verify-registration-otp.dto";
import {
	InvalidOtpError,
	MaxAttemptsExceededError,
} from "../../../../../src/application/modules/authentication/errors";
import { VerifyRegistrationOtpUseCase } from "../../../../../src/application/modules/authentication/use-cases/registration/verify-registration-otp.use-case";
import type { ITokenService } from "../../../../../src/application/services";
import { UserNotFoundError } from "../../../../../src/application/shared/errors/user-not-found.error";
import type {
	IOtpRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("VerifyRegistrationOtpUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let otpRepository: ReturnType<typeof createMock<IOtpRepository>>;
	let tokenService: ReturnType<typeof createMock<ITokenService>>;
	let eventBus: ReturnType<typeof createMock<EventBus>>;
	let useCase: VerifyRegistrationOtpUseCase;

	const input: VerifyRegistrationOtpInput = {
		email: "new@example.com",
		otp: "123456",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		otpRepository = createMock<IOtpRepository>();
		tokenService = createMock<ITokenService>();
		eventBus = createMock<EventBus>();

		useCase = new VerifyRegistrationOtpUseCase(
			userRepository,
			otpRepository,
			tokenService,
			eventBus,
		);
	});

	it("should throw UserNotFoundError when the user does not exist", async () => {
		userRepository.findByEmail.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw MaxAttemptsExceededError when attempts are already maxed", async () => {
		userRepository.findByEmail.mockResolvedValue(
			createUser({ email: input.email }),
		);
		otpRepository.getAttempts.mockResolvedValue(5);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			MaxAttemptsExceededError,
		);

		expect(otpRepository.getCode).not.toHaveBeenCalled();
	});

	it("should throw InvalidOtpError and increment attempts for an invalid code", async () => {
		userRepository.findByEmail.mockResolvedValue(
			createUser({ email: input.email }),
		);
		otpRepository.getAttempts.mockResolvedValue(0);
		otpRepository.getCode.mockResolvedValue("654321");
		otpRepository.incrementAttempts.mockResolvedValue(1);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			InvalidOtpError,
		);

		expect(otpRepository.incrementAttempts).toHaveBeenCalledWith(
			expect.any(String),
			"REGISTER",
			300,
		);
		expect(otpRepository.deleteAll).not.toHaveBeenCalled();
	});

	it("should delete otp data and throw MaxAttemptsExceededError when final attempt fails", async () => {
		userRepository.findByEmail.mockResolvedValue(
			createUser({ email: input.email }),
		);
		otpRepository.getAttempts.mockResolvedValue(4);
		otpRepository.getCode.mockResolvedValue("654321");
		otpRepository.incrementAttempts.mockResolvedValue(5);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			MaxAttemptsExceededError,
		);

		expect(otpRepository.deleteAll).toHaveBeenCalledWith(
			expect.any(String),
			"REGISTER",
		);
	});

	it("should verify the otp, update the user, publish the event, and return setup token", async () => {
		const user = createUser({ email: input.email, isVerified: false });
		const updatedUser = createUser({
			id: user.id,
			email: user.email,
			isVerified: true,
		});

		userRepository.findByEmail.mockResolvedValue(user);
		otpRepository.getAttempts.mockResolvedValue(0);
		otpRepository.getCode.mockResolvedValue(input.otp);
		otpRepository.deleteAll.mockResolvedValue(undefined);
		userRepository.updateById.mockResolvedValue(updatedUser);
		tokenService.generateSetupToken.mockResolvedValue("setup-token");

		const result = await useCase.execute(input);

		expect(result).toEqual({ setupToken: "setup-token" });
		expect(userRepository.updateById).toHaveBeenCalledWith(user.id, {
			isVerified: true,
		});
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				eventName: "user.registered",
				payload: {
					userId: updatedUser.id,
					email: updatedUser.email,
				},
			}),
		);
		expect(tokenService.generateSetupToken).toHaveBeenCalledWith({
			sub: updatedUser.id,
		});
	});
});
