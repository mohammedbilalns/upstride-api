import { beforeEach, describe, expect, it } from "vitest";
import { UserNotFoundError } from "../../../../src/application/modules/authentication/errors";
import { GetCoinBalanceUseCase } from "../../../../src/application/modules/wallet/use-cases/get-coin-balance.use-case";
import type { IUserRepository } from "../../../../src/domain/repositories";
import { COIN_VALUE } from "../../../../src/shared/constants";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetCoinBalanceUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let useCase: GetCoinBalanceUseCase;

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		useCase = new GetCoinBalanceUseCase(userRepository);
	});

	it("should throw UserNotFoundError when user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({ userId: "non-existent" }),
		).rejects.toBeInstanceOf(UserNotFoundError);
	});

	it("should return user coin balance and coin value", async () => {
		const mockUser = createUser({ id: "user-1", coinBalance: 150 });
		userRepository.findById.mockResolvedValue(mockUser);

		const result = await useCase.execute({ userId: "user-1" });

		expect(userRepository.findById).toHaveBeenCalledWith("user-1");
		expect(result).toEqual({
			coinBalance: 150,
			coinValue: COIN_VALUE,
		});
	});
});
