import { inject } from "inversify";
import type { IUserRepository } from "../../../../../domain/repositories";
import { TYPES } from "../../../../../shared/types/types";
import type { IPasswordService } from "../../../../services";
import type { LoginResponse } from "../../dtos";
import { AuthenticationError } from "../../errors";
import type { IAuthSessionService } from "../../services";
import type { IDummyLoginUseCase } from "./dummy-login.use-case.interface";

export class DummyLoginUseCase implements IDummyLoginUseCase {
	private readonly DUMMY_EMAIL = "dummy@upstride.com";
	private readonly DUMMY_PASSWORD = "dummyPassword";

	constructor(
		@inject(TYPES.Repositories.UserRepository)
		private readonly _userRepository: IUserRepository,
		@inject(TYPES.Services.Password)
		private readonly _passwordService: IPasswordService,
		@inject(TYPES.Services.AuthSession)
		private readonly _authSessionService: IAuthSessionService,
	) {}

	async execute(): Promise<LoginResponse> {
		const existingDummyAccount = await this._userRepository.findByEmail(
			this.DUMMY_EMAIL,
		);

		if (!existingDummyAccount) {
			throw new AuthenticationError("Dummy account does not exist");
		}

		const isPasswordCorrect = await this._passwordService.verifyPassword(
			this.DUMMY_PASSWORD,
			existingDummyAccount.passwordHash,
		);
		if (!isPasswordCorrect) {
			throw new AuthenticationError("Invalid password");
		}

		return this._authSessionService.createLoginResponse(
			existingDummyAccount,
			{},
		);
	}
}
