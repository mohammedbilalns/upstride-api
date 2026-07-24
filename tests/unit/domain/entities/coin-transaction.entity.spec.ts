import { describe, expect, it } from "vitest";
import {
	CoinTransaction,
	CoinTransactionType,
} from "../../../../src/domain/entities/coin-transactions.entity";
import { EntityValidationError } from "../../../../src/domain/errors/entity-validation.error";

describe("CoinTransaction Entity", () => {
	describe("constructor validation", () => {
		it("should throw when userId is missing", () => {
			expect(() => {
				new CoinTransaction(
					"coin-tx-1",
					"",
					100,
					CoinTransactionType.Purchase,
					undefined,
					undefined,
					new Date(),
					"user",
				);
			}).toThrow(EntityValidationError);
		});

		it("should throw when amount is zero", () => {
			const now = new Date();
			expect(() => {
				new CoinTransaction(
					"coin-tx-1",
					"user-1",
					0,
					CoinTransactionType.Purchase,
					undefined,
					undefined,
					now,
					"user",
				);
			}).toThrow(EntityValidationError);
		});

		it("should allow negative amount (refund)", () => {
			const now = new Date();
			const tx = new CoinTransaction(
				"t1",
				"u1",
				-50,
				CoinTransactionType.Refund,
				undefined,
				undefined,
				now,
				"user",
			);

			expect(tx.amount).toBe(-50);
		});

		it("should create valid transaction", () => {
			const now = new Date();
			const tx = new CoinTransaction(
				"t1",
				"u1",
				100,
				CoinTransactionType.Purchase,
				undefined,
				undefined,
				now,
				"user",
			);

			expect(tx.id).toBe("t1");
			expect(tx.userId).toBe("u1");
			expect(tx.amount).toBe(100);
			expect(tx.type).toBe(CoinTransactionType.Purchase);
		});
	});

	describe("immutability", () => {
		it("should be frozen", () => {
			const tx = new CoinTransaction(
				"t1",
				"u1",
				100,
				CoinTransactionType.Purchase,
			);

			expect(() => {
				const txRecord = tx as unknown as Record<string, number>;
				txRecord.amount = 200;
			}).toThrow();
		});

		it("should prevent new properties", () => {
			const tx = new CoinTransaction(
				"t1",
				"u1",
				100,
				CoinTransactionType.Purchase,
			);

			expect(() => {
				const txRecord = tx as unknown as Record<string, string>;
				txRecord.newProp = "value";
			}).toThrow();
		});
	});

	describe("transaction types", () => {
		it("should allow all transaction types", () => {
			const types: CoinTransactionType[] = [
				CoinTransactionType.Purchase,
				CoinTransactionType.SessionSpend,
				CoinTransactionType.SessionEarning,
				CoinTransactionType.AppreciationSpend,
				CoinTransactionType.AppreciationEarning,
				CoinTransactionType.ArticleReward,
				CoinTransactionType.SignupBonus,
				CoinTransactionType.Refund,
			];

			types.forEach((type) => {
				const tx = new CoinTransaction("t1", "u1", 100, type);
				expect(tx.type).toBe(type);
			});
		});
	});
});
