import { describe, expect, it } from "vitest";
import { PlatformWallet } from "../../../../src/domain/entities/platform-wallet.entity";
import { EntityValidationError } from "../../../../src/domain/errors";

describe("PlatformWallet Entity", () => {
	describe("constructor", () => {
		it("should create a valid platform wallet", () => {
			const now = new Date();
			const wallet = new PlatformWallet("wallet-1", 10000, now, now);

			expect(wallet.id).toBe("wallet-1");
			expect(wallet.balance).toBe(10000);
			expect(wallet.createdAt).toEqual(now);
			expect(wallet.updatedAt).toEqual(now);
		});

		it("should allow zero balance", () => {
			const now = new Date();
			const wallet = new PlatformWallet("wallet-2", 0, now, now);

			expect(wallet.balance).toBe(0);
		});

		it("should throw when balance is negative", () => {
			const now = new Date();
			expect(() => {
				new PlatformWallet("wallet-3", -100, now, now);
			}).toThrow(EntityValidationError);
		});

		it("should handle large balances", () => {
			const now = new Date();
			const wallet = new PlatformWallet("wallet-4", 1000000000, now, now);

			expect(wallet.balance).toBe(1000000000);
		});

		it("should handle small positive balances", () => {
			const now = new Date();
			const wallet = new PlatformWallet("wallet-5", 1, now, now);

			expect(wallet.balance).toBe(1);
		});

		it("should track creation and update times", () => {
			const created = new Date("2026-07-20");
			const updated = new Date("2026-07-24");

			const wallet = new PlatformWallet("wallet-6", 5000, created, updated);

			expect(wallet.createdAt).toEqual(created);
			expect(wallet.updatedAt).toEqual(updated);
		});
	});
});
