import { describe, expect, it } from "vitest";
import {
	PaymentProvider,
	PaymentStatus,
	PaymentTransaction,
} from "../../../../src/domain/entities/payment-transactions.entity";

describe("PaymentTransaction Entity", () => {
	it("should create payment transaction", () => {
		const txn = new PaymentTransaction(
			"txn-1",
			"user-1",
			PaymentProvider.Stripe,
			"stripe-id",
			10000,
			"USD",
			PaymentStatus.Completed,
			100,
			"coins",
			"STRIPE",
		);

		expect(txn.id).toBe("txn-1");
		expect(txn.status).toBe(PaymentStatus.Completed);
	});

	it("should throw without provider payment id", () => {
		expect(() => {
			new PaymentTransaction(
				"txn-1",
				"user-1",
				PaymentProvider.Stripe,
				"",
				10000,
				"USD",
				PaymentStatus.Completed,
				100,
				"coins",
				"STRIPE",
			);
		}).toThrow();
	});

	it("should be frozen after creation", () => {
		const txn = new PaymentTransaction(
			"txn-1",
			"user-1",
			PaymentProvider.Internal,
			"internal-id",
			5000,
			"USD",
			PaymentStatus.Pending,
			50,
			"coins",
			"COINS",
		);

		expect(() => {
			(txn as never as { amount: number }).amount = 10000;
		}).toThrow();
	});
});
