import { beforeEach, describe, expect, it } from "vitest";
import { AuthenticationError } from "../../../../src/application/modules/authentication/errors";
import { ChangePasswordUseCase } from "../../../../src/application/modules/profile/use-cases/change-password.use-case";
import type { ITokenService } from "../../../../src/application/services";
import type { IPasswordService } from "../../../../src/application/services/password.service.interface";
import type { IUserRepository } from "../../../../src/domain/repositories";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("ChangePasswordUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let passwordService: ReturnType<typeof createMock<IPasswordService>>;
	let tokenService: ReturnType<typeof createMock<ITokenService>>;
	let useCase: ChangePasswordUseCase;

	const baseInput = {
		userId: "user-1",
		token: "reset-token",
		newPassword: "new-password",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		passwordService = createMock<IPasswordService>();
		tokenService = createMock<ITokenService>();
		useCase = new ChangePasswordUseCase(
			userRepository,
			passwordService,
			tokenService,
		);
	});

	it("should throw when the token subject does not match the user", async () => {
		userRepository.findById.mockResolvedValue(createUser());
		tokenService.verifyResetToken.mockResolvedValue({ sub: "user-2" });

		await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
			AuthenticationError,
		);
	});

	it("should hash the password and update the user", async () => {
		userRepository.findById.mockResolvedValue(createUser());
		tokenService.verifyResetToken.mockResolvedValue({ sub: "user-1" });
		passwordService.hashPassword.mockResolvedValue("hashed-password");

		await useCase.execute(baseInput);

		expect(userRepository.updateById).toHaveBeenCalledWith("user-1", {
			passwordHash: "hashed-password",
		});
	});
});
