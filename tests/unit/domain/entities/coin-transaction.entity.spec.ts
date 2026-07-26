import { describe, expect, it } from "vitest";
import {
	CoinTransaction,
	CoinTransactionType,
} from "../../../../src/domain/entities/coin-transactions.entity";

describe("CoinTransaction Entity", () => {
	it("should create coin transaction", () => {
		const txn = new CoinTransaction(
			"coin-txn-1",
			"user-1",
			100,
			CoinTransactionType.Purchase,
		);

		expect(txn.amount).toBe(100);
		expect(txn.type).toBe(CoinTransactionType.Purchase);
	});

	it("should throw with zero amount", () => {
		expect(() => {
			new CoinTransaction(
				"coin-txn-1",
				"user-1",
				0,
				CoinTransactionType.Purchase,
			);
		}).toThrow();
	});

	it("should allow negative amounts", () => {
		const txn = new CoinTransaction(
			"coin-txn-1",
			"user-1",
			-50,
			CoinTransactionType.SessionSpend,
		);

		expect(txn.amount).toBe(-50);
	});

	it("should be frozen after creation", () => {
		const txn = new CoinTransaction(
			"coin-txn-1",
			"user-1",
			100,
			CoinTransactionType.Purchase,
		);

		expect(() => {
			(txn as never as { amount: number }).amount = 500;
		}).toThrow();
	});
});
