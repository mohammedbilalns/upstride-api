import { beforeEach, describe, expect, it } from "vitest";
import { UpsertPaymentTransactionService } from "../../../../../../src/application/modules/payment/services/upsert-payment-transaction.service";
import type { IIdGenerator } from "../../../../../../src/application/services/id-generator.service.interface";
import {
	PaymentProvider,
	PaymentStatus,
	PaymentTransaction,
} from "../../../../../../src/domain/entities/payment-transactions.entity";
import type { IPaymentTransactionRepository } from "../../../../../../src/domain/repositories/payment-transactions.repository.interface";
import { createMock } from "../../../../../factories/utilities/create-mock";

describe("UpsertPaymentTransactionService", () => {
	let paymentRepository: ReturnType<
		typeof createMock<IPaymentTransactionRepository>
	>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let service: UpsertPaymentTransactionService;

	beforeEach(() => {
		paymentRepository = createMock<IPaymentTransactionRepository>();
		idGenerator = createMock<IIdGenerator>();
		idGenerator.generate.mockReturnValue("txn-new");

		service = new UpsertPaymentTransactionService(
			paymentRepository,
			idGenerator,
		);
	});

	describe("upsert", () => {
		const mockInput = {
			existing: null,
			userId: "user-1",
			provider: PaymentProvider.Stripe,
			sessionId: "pi_123",
			amountMinor: 1000,
			currency: "usd",
			coins: 100,
			purpose: "coins" as const,
			owner: "user" as const,
		};

		it("should create new transaction if not found", async () => {
			await service.upsert(mockInput);

			expect(paymentRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "txn-new",
					userId: "user-1",
					providerPaymentId: "pi_123",
					status: PaymentStatus.Completed,
				}),
			);
			expect(
				paymentRepository.updateStatusByProviderPaymentIdAndOwner,
			).not.toHaveBeenCalled();
		});

		it("should update transaction if found and status is different", async () => {
			const existingTxn = new PaymentTransaction(
				"txn-1",
				"user-1",
				PaymentProvider.Stripe,
				"pi_123",
				1000,
				"usd",
				PaymentStatus.Pending,
				100,
				"coins",
				"STRIPE",
			);

			await service.upsert({
				...mockInput,
				existing: existingTxn,
			});

			expect(
				paymentRepository.updateStatusByProviderPaymentIdAndOwner,
			).toHaveBeenCalledWith("pi_123", PaymentStatus.Completed, "user");
			expect(paymentRepository.create).not.toHaveBeenCalled();
		});

		it("should not update if transaction found and status is same", async () => {
			const existingTxn = new PaymentTransaction(
				"txn-1",
				"user-1",
				PaymentProvider.Stripe,
				"pi_123",
				1000,
				"usd",
				PaymentStatus.Completed, // Same status
				100,
				"coins",
				"STRIPE",
			);

			await service.upsert({
				...mockInput,
				existing: existingTxn,
			});

			expect(
				paymentRepository.updateStatusByProviderPaymentIdAndOwner,
			).not.toHaveBeenCalled();
			expect(paymentRepository.create).not.toHaveBeenCalled();
		});
	});
});
