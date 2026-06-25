import type { Mocked } from "vitest";
import { beforeEach, describe, expect, it } from "vitest";
import type { LoginResponse } from "../../../../src/application/modules/authentication/dtos";
import { AuthenticationError } from "../../../../src/application/modules/authentication/errors";
import type { IAuthSessionService } from "../../../../src/application/modules/authentication/services";
import { LoginWithEmailUseCase } from "../../../../src/application/modules/authentication/use-cases";
import type { IPasswordService } from "../../../../src/application/services";
import type { IUserRepository } from "../../../../src/domain/repositories";
import { createLoginResponse } from "../../../factories/dtos/login-response.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("LoginWithEmailUseCase", () => {
	let userRepository: Mocked<IUserRepository>;
	let passwordService: Mocked<IPasswordService>;
	let authSessionService: Mocked<IAuthSessionService>;

	let useCase: LoginWithEmailUseCase;

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		passwordService = createMock<IPasswordService>();
		authSessionService = createMock<IAuthSessionService>();

		useCase = new LoginWithEmailUseCase(
			userRepository,
			passwordService,
			authSessionService,
		);
	});

	const input = {
		email: "test@example.com",
		password: "password123",
	};

	it("should throw AuthenticationError when user does not exist", async () => {
		userRepository.findByEmail.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			AuthenticationError,
		);

		expect(passwordService.fakeVerify).toHaveBeenCalledOnce();

		expect(passwordService.verifyPassword).not.toHaveBeenCalled();
	});

	it("should reject non local accounts", async () => {
		userRepository.findByEmail.mockResolvedValue(
			createUser({
				authType: "GOOGLE",
			}),
		);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			AuthenticationError,
		);

		expect(passwordService.fakeVerify).toHaveBeenCalledOnce();

		expect(passwordService.verifyPassword).not.toHaveBeenCalled();
	});

	it("should reject unverified users", async () => {
		userRepository.findByEmail.mockResolvedValue(
			createUser({
				isVerified: false,
			}),
		);

		await expect(useCase.execute(input)).rejects.toThrow();

		expect(passwordService.fakeVerify).toHaveBeenCalledOnce();
	});

	it("should reject blocked users", async () => {
		userRepository.findByEmail.mockResolvedValue(
			createUser({
				isBlocked: true,
			}),
		);

		await expect(useCase.execute(input)).rejects.toThrow();

		expect(passwordService.verifyPassword).not.toHaveBeenCalled();
	});

	it("should reject invalid password", async () => {
		const user = createUser();

		userRepository.findByEmail.mockResolvedValue(user);

		passwordService.verifyPassword.mockResolvedValue(false);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			AuthenticationError,
		);

		expect(passwordService.verifyPassword).toHaveBeenCalledWith(
			input.password,
			user.passwordHash,
		);
	});

	it("should login successfully", async () => {
		const user = createUser();

		const loginResponse: LoginResponse = createLoginResponse();

		userRepository.findByEmail.mockResolvedValue(user);

		passwordService.verifyPassword.mockResolvedValue(true);

		authSessionService.createLoginResponse.mockResolvedValue(loginResponse);

		const result = await useCase.execute(input);

		expect(result).toEqual(loginResponse);

		expect(authSessionService.createLoginResponse).toHaveBeenCalledWith(
			user,
			input,
		);
	});
});
