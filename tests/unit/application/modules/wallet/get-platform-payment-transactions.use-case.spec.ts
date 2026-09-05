import { beforeEach, describe, expect, it } from "vitest";
import { GetPlatformPaymentTransactionsUseCase } from "../../../../../src/application/modules/wallet/use-cases/get-platform-payment-transactions.use-case";
import { PaymentStatus } from "../../../../../src/domain/entities/payment-transactions.entity";
import type { IPaymentTransactionRepository } from "../../../../../src/domain/repositories/payment-transactions.repository.interface";
import { createPaymentTransaction } from "../../../../factories/entities/payment-transaction.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetPlatformPaymentTransactionsUseCase", () => {
	let paymentTransactionRepository: ReturnType<
		typeof createMock<IPaymentTransactionRepository>
	>;
	let useCase: GetPlatformPaymentTransactionsUseCase;

	beforeEach(() => {
		paymentTransactionRepository = createMock<IPaymentTransactionRepository>();
		useCase = new GetPlatformPaymentTransactionsUseCase(
			paymentTransactionRepository,
		);
	});

	it("should paginate platform payment transactions and include effective revenue summary", async () => {
		const mockTx = createPaymentTransaction({
			id: "pay-p1",
			transactionOwner: "platform",
			status: PaymentStatus.Completed,
			amount: 5000,
		});

		paymentTransactionRepository.paginate.mockResolvedValue({
			items: [mockTx],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		paymentTransactionRepository.getEffectivePlatformRevenue.mockResolvedValue(
			5000,
		);

		const result = await useCase.execute({
			page: 1,
			limit: 10,
		});

		expect(paymentTransactionRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 10,
			query: {
				status: undefined,
				transactionOwner: "platform",
			},
			sort: { createdAt: -1 },
		});
		expect(
			paymentTransactionRepository.getEffectivePlatformRevenue,
		).toHaveBeenCalled();
		expect(result.summary.effectiveRevenue).toBe(5000);
		expect(result.items).toHaveLength(1);
	});
});
