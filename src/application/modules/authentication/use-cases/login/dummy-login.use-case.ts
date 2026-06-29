import { inject } from "inversify";
import type { IUserRepository } from "../../../../../domain/repositories";
import env from "../../../../../shared/config/env";
import { TYPES } from "../../../../../shared/types/types";
import type { LoginResponse } from "../../dtos";
import { AuthenticationError } from "../../errors";
import type { IAuthSessionService } from "../../services";
import type { IDummyLoginUseCase } from "./dummy-login.use-case.interface";

export class DummyLoginUseCase implements IDummyLoginUseCase {
	constructor(
		@inject(TYPES.Repositories.UserRepository)
		private readonly _userRepository: IUserRepository,
		@inject(TYPES.Services.AuthSession)
		private readonly _authSessionService: IAuthSessionService,
	) {}

	async execute(): Promise<LoginResponse> {
		const existingDummyAccount = await this._userRepository.findByEmail(
			env.DUMMY_LOGIN_EMAIL,
		);

		if (!existingDummyAccount) {
			throw new AuthenticationError("Dummy account does not exist");
		}

		return this._authSessionService.createLoginResponse(
			existingDummyAccount,
			{},
		);
	}
}
