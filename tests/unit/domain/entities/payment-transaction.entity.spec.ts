import { describe, expect, it } from "vitest";
import {
	PaymentProvider,
	PaymentStatus,
	PaymentTransaction,
} from "../../../../src/domain/entities/payment-transactions.entity";
import { EntityValidationError } from "../../../../src/domain/errors/entity-validation.error";

describe("PaymentTransaction Entity", () => {
	describe("constructor validation", () => {
		it("should throw when providerPaymentId empty", () => {
			expect(() => {
				new PaymentTransaction(
					"p1",
					"u1",
					PaymentProvider.Stripe,
					"",
					10000,
					"INR",
					PaymentStatus.Completed,
					100,
					"coins",
					"STRIPE",
				);
			}).toThrow(EntityValidationError);
		});

		it("should create valid transaction", () => {
			const now = new Date();
			const tx = new PaymentTransaction(
				"p1",
				"u1",
				PaymentProvider.Stripe,
				"stripe-1",
				10000,
				"INR",
				PaymentStatus.Completed,
				100,
				"coins",
				"STRIPE",
				now,
				"user",
			);

			expect(tx.id).toBe("p1");
			expect(tx.userId).toBe("u1");
			expect(tx.provider).toBe(PaymentProvider.Stripe);
			expect(tx.amount).toBe(10000);
		});
	});

	describe("immutability", () => {
		it("should be frozen", () => {
			const tx = new PaymentTransaction(
				"p1",
				"u1",
				PaymentProvider.Stripe,
				"stripe-1",
				10000,
				"INR",
				PaymentStatus.Completed,
				100,
				"coins",
				"STRIPE",
			);

			expect(() => {
				const txRecord = tx as unknown as Record<string, PaymentStatus>;
				txRecord.status = PaymentStatus.Failed;
			}).toThrow();
		});

		it("should prevent new properties", () => {
			const tx = new PaymentTransaction(
				"p1",
				"u1",
				PaymentProvider.Stripe,
				"stripe-1",
				10000,
				"INR",
				PaymentStatus.Completed,
				100,
				"coins",
				"STRIPE",
			);

			expect(() => {
				const txRecord = tx as unknown as Record<string, string>;
				txRecord.newProp = "value";
			}).toThrow();
		});
	});

	describe("payment statuses", () => {
		it("should allow all payment statuses", () => {
			const statuses = [
				PaymentStatus.Pending,
				PaymentStatus.Completed,
				PaymentStatus.Failed,
				PaymentStatus.Refunded,
			];

			statuses.forEach((status) => {
				const tx = new PaymentTransaction(
					"p1",
					"u1",
					PaymentProvider.Stripe,
					"stripe-1",
					10000,
					"INR",
					status,
					100,
					"coins",
					"STRIPE",
				);
				expect(tx.status).toBe(status);
			});
		});
	});
});
