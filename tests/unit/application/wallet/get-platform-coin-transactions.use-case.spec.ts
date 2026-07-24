import { beforeEach, describe, expect, it } from "vitest";
import { GetPlatformCoinTransactionsUseCase } from "../../../../src/application/modules/wallet/use-cases/get-platform-coin-transactions.use-case";
import { CoinTransactionType } from "../../../../src/domain/entities/coin-transactions.entity";
import type { ICoinTransactionRepository } from "../../../../src/domain/repositories";
import { createCoinTransaction } from "../../../factories/entities/coin-transactions.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetPlatformCoinTransactionsUseCase", () => {
	let coinTransactionRepository: ReturnType<
		typeof createMock<ICoinTransactionRepository>
	>;
	let useCase: GetPlatformCoinTransactionsUseCase;

	beforeEach(() => {
		coinTransactionRepository = createMock<ICoinTransactionRepository>();
		useCase = new GetPlatformCoinTransactionsUseCase(coinTransactionRepository);
	});

	it("should paginate platform coin transactions", async () => {
		const mockTx = createCoinTransaction({
			id: "tx-p1",
			transactionOwner: "platform",
			type: CoinTransactionType.Purchase,
		});

		coinTransactionRepository.paginate.mockResolvedValue({
			items: [mockTx],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});

		const result = await useCase.execute({
			page: 1,
			limit: 10,
		});

		expect(coinTransactionRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 10,
			query: {
				type: undefined,
				transactionOwner: "platform",
			},
			sort: { createdAt: -1 },
		});
		expect(result.items).toHaveLength(1);
	});

	it("should apply sort ascending when sort is old", async () => {
		coinTransactionRepository.paginate.mockResolvedValue({
			items: [],
			total: 0,
			page: 1,
			limit: 10,
			totalPages: 0,
		});

		await useCase.execute({
			sort: "old",
			page: 1,
			limit: 10,
		});

		expect(coinTransactionRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 10,
			query: {
				type: undefined,
				transactionOwner: "platform",
			},
			sort: { createdAt: 1 },
		});
	});
});
