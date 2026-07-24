import { beforeEach, describe, expect, it } from "vitest";
import { GetPaymentTransactionsUseCase } from "../../../../src/application/modules/wallet/use-cases/get-payment-transactions.use-case";
import { PaymentStatus } from "../../../../src/domain/entities/payment-transactions.entity";
import type { IPaymentTransactionRepository } from "../../../../src/domain/repositories/payment-transactions.repository.interface";
import { createPaymentTransaction } from "../../../factories/entities/payment-transaction.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetPaymentTransactionsUseCase", () => {
	let paymentTransactionRepository: ReturnType<
		typeof createMock<IPaymentTransactionRepository>
	>;
	let useCase: GetPaymentTransactionsUseCase;

	beforeEach(() => {
		paymentTransactionRepository = createMock<IPaymentTransactionRepository>();
		useCase = new GetPaymentTransactionsUseCase(paymentTransactionRepository);
	});

	it("should paginate completed user payment transactions with desc sort", async () => {
		const mockTx = createPaymentTransaction({
			id: "pay-1",
			userId: "user-1",
			status: PaymentStatus.Completed,
			amount: 1000,
		});

		paymentTransactionRepository.paginate.mockResolvedValue({
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

		expect(paymentTransactionRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 10,
			query: {
				userId: "user-1",
				status: PaymentStatus.Completed,
				transactionOwner: "user",
			},
			sort: { createdAt: -1 },
		});
		expect(result.items).toHaveLength(1);
		expect(result.total).toBe(1);
	});

	it("should support old sort option", async () => {
		paymentTransactionRepository.paginate.mockResolvedValue({
			items: [],
			total: 0,
			page: 1,
			limit: 10,
			totalPages: 0,
		});

		await useCase.execute({
			userId: "user-1",
			sort: "old",
			page: 1,
			limit: 10,
		});

		expect(paymentTransactionRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 10,
			query: {
				userId: "user-1",
				status: PaymentStatus.Completed,
				transactionOwner: "user",
			},
			sort: { createdAt: 1 },
		});
	});
});
