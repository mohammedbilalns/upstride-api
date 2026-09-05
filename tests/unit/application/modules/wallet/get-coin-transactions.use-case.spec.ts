import { beforeEach, describe, expect, it } from "vitest";
import { GetCoinTransactionsUseCase } from "../../../../../src/application/modules/wallet/use-cases/get-coin-transactions.use-case";
import { CoinTransactionType } from "../../../../../src/domain/entities/coin-transactions.entity";
import type { ICoinTransactionRepository } from "../../../../../src/domain/repositories";
import { createCoinTransaction } from "../../../../factories/entities/coin-transactions.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetCoinTransactionsUseCase", () => {
	let coinTransactionRepository: ReturnType<
		typeof createMock<ICoinTransactionRepository>
	>;
	let useCase: GetCoinTransactionsUseCase;

	beforeEach(() => {
		coinTransactionRepository = createMock<ICoinTransactionRepository>();
		useCase = new GetCoinTransactionsUseCase(coinTransactionRepository);
	});

	it("should paginate user coin transactions with default sort desc", async () => {
		const mockTx = createCoinTransaction({
			id: "tx-1",
			userId: "user-1",
			type: CoinTransactionType.ArticleReward,
			amount: 50,
		});

		coinTransactionRepository.paginate.mockResolvedValue({
			items: [mockTx],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});

		const result = await useCase.execute({
			userId: "user-1",
			page: 1,
			limit: 10,
		});

		expect(coinTransactionRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 10,
			query: {
				userId: "user-1",
				type: undefined,
				transactionOwner: "user",
			},
			sort: { createdAt: -1 },
		});
		expect(result.items).toHaveLength(1);
		expect(result.total).toBe(1);
	});

	it("should sort ascending when sort is old and filter by type", async () => {
		const mockTx = createCoinTransaction({
			id: "tx-2",
			userId: "user-1",
			type: CoinTransactionType.SessionSpend,
			amount: 20,
		});

		coinTransactionRepository.paginate.mockResolvedValue({
			items: [mockTx],
			total: 1,
			page: 2,
			limit: 5,
			totalPages: 1,
		});

		const result = await useCase.execute({
			userId: "user-1",
			type: CoinTransactionType.SessionSpend,
			sort: "old",
			page: 2,
			limit: 5,
		});

		expect(coinTransactionRepository.paginate).toHaveBeenCalledWith({
			page: 2,
			limit: 5,
			query: {
				userId: "user-1",
				type: CoinTransactionType.SessionSpend,
				transactionOwner: "user",
			},
			sort: { createdAt: 1 },
		});
		expect(result.items).toHaveLength(1);
	});
});
