import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "../../../../src/application/modules/authentication/errors";
import type { IAuthSessionService } from "../../../../src/application/modules/authentication/services";
import { DummyLoginUseCase } from "../../../../src/application/modules/authentication/use-cases/login/dummy-login.use-case";
import type { IUserRepository } from "../../../../src/domain/repositories";
import { createLoginResponse } from "../../../factories/dtos/login-response.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

vi.mock("../../../../src/shared/config/env", () => ({
	default: {
		DUMMY_LOGIN_EMAIL: "dummy@example.com",
	},
}));

describe("DummyLoginUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let authSessionService: ReturnType<typeof createMock<IAuthSessionService>>;

	let useCase: DummyLoginUseCase;

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		authSessionService = createMock<IAuthSessionService>();

		useCase = new DummyLoginUseCase(userRepository, authSessionService);
	});

	it("should throw AuthenticationError when dummy account does not exist", async () => {
		userRepository.findByEmail.mockResolvedValue(null);

		await expect(useCase.execute()).rejects.toBeInstanceOf(AuthenticationError);

		expect(userRepository.findByEmail).toHaveBeenCalledWith(
			"dummy@example.com",
		);
		expect(authSessionService.createLoginResponse).not.toHaveBeenCalled();
	});

	it("should return a login response for the dummy account", async () => {
		const dummyAccount = createUser({
			email: "dummy@example.com",
			authType: "LOCAL",
		});
		const loginResponse = createLoginResponse();

		userRepository.findByEmail.mockResolvedValue(dummyAccount);
		authSessionService.createLoginResponse.mockResolvedValue(loginResponse);

		const result = await useCase.execute();

		expect(result).toEqual(loginResponse);
		expect(userRepository.findByEmail).toHaveBeenCalledWith(
			"dummy@example.com",
		);
		expect(authSessionService.createLoginResponse).toHaveBeenCalledWith(
			dummyAccount,
			{},
		);
	});
});
