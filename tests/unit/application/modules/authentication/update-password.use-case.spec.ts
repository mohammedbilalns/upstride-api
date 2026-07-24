import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UpdatePasswordInput } from "../../../../../src/application/modules/authentication/dtos/password/password-reset.dto";
import {
	AuthenticationError,
	UnauthorizedError,
	UserNotFoundError,
} from "../../../../../src/application/modules/authentication/errors";
import { UpdatePasswordUseCase } from "../../../../../src/application/modules/authentication/use-cases/password-reset/update-password.use-case";
import type {
	IPasswordService,
	ITokenService,
} from "../../../../../src/application/services";
import type { IUserRepository } from "../../../../../src/domain/repositories";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

vi.mock("../../../../src/shared/config/env", () => ({
	default: {
		DUMMY_LOGIN_EMAIL: "dummy@example.com",
	},
}));

describe("UpdatePasswordUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let passwordService: ReturnType<typeof createMock<IPasswordService>>;
	let tokenService: ReturnType<typeof createMock<ITokenService>>;
	let useCase: UpdatePasswordUseCase;

	const input: UpdatePasswordInput = {
		email: "test@example.com",
		tempToken: "valid-reset-token",
		newPassword: "newPassword123",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		passwordService = createMock<IPasswordService>();
		tokenService = createMock<ITokenService>();

		useCase = new UpdatePasswordUseCase(
			userRepository,
			passwordService,
			tokenService,
		);
	});

	it("should throw UnauthorizedError when trying to update dummy user password", async () => {
		const dummyEmail = "dummy@example.com";
		const dummyInput: UpdatePasswordInput = {
			...input,
			email: dummyEmail,
		};

		await expect(useCase.execute(dummyInput)).rejects.toBeInstanceOf(
			UnauthorizedError,
		);
	});

	it("should throw UserNotFoundError when user not found", async () => {
		userRepository.findByEmail.mockResolvedValue(null);
		tokenService.verifyResetToken.mockResolvedValue({ sub: "user-1" });

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should throw AuthenticationError when token sub does not match user id", async () => {
		const user = createUser({ id: "user-1", email: input.email });
		userRepository.findByEmail.mockResolvedValue(user);
		tokenService.verifyResetToken.mockResolvedValue({ sub: "different-user" });

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			AuthenticationError,
		);
	});

	it("should update password successfully", async () => {
		const user = createUser({ id: "user-1", email: input.email });
		userRepository.findByEmail.mockResolvedValue(user);
		tokenService.verifyResetToken.mockResolvedValue({ sub: user.id });
		passwordService.hashPassword.mockResolvedValue("hashed-new-password");
		userRepository.updateById.mockResolvedValue(user);

		await useCase.execute(input);

		expect(passwordService.hashPassword).toHaveBeenCalledWith(
			input.newPassword,
		);
		expect(userRepository.updateById).toHaveBeenCalledWith(user.id, {
			passwordHash: "hashed-new-password",
		});
	});
});
