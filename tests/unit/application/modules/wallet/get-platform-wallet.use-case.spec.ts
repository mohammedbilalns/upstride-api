import { beforeEach, describe, expect, it } from "vitest";
import { GetPlatformWalletUseCase } from "../../../../../src/application/modules/wallet/use-cases/get-platform-wallet.use-case";
import type { IPlatformWalletRepository } from "../../../../../src/domain/repositories/platform-wallet.repository.interface";
import { createPlatformWallet } from "../../../../factories/entities/platform-wallet.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetPlatformWalletUseCase", () => {
	let platformWalletRepository: ReturnType<
		typeof createMock<IPlatformWalletRepository>
	>;
	let useCase: GetPlatformWalletUseCase;

	beforeEach(() => {
		platformWalletRepository = createMock<IPlatformWalletRepository>();
		useCase = new GetPlatformWalletUseCase(platformWalletRepository);
	});

	it("should return converted platform wallet balance in main currency units", async () => {
		const mockWallet = createPlatformWallet({ balance: 50000 });
		platformWalletRepository.getOrCreate.mockResolvedValue(mockWallet);

		const result = await useCase.execute();

		expect(platformWalletRepository.getOrCreate).toHaveBeenCalled();
		expect(result.balance).toBe(500);
	});
});
