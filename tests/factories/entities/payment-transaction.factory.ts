import {
	PaymentProvider,
	PaymentStatus,
	PaymentTransaction,
} from "../../../src/domain/entities/payment-transactions.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createPaymentTransaction(
	overrides: Partial<PaymentTransaction> = {},
): PaymentTransaction {
	const data = mergeDefaults<PaymentTransaction>(
		{
			id: "payment-1",
			userId: "user-1",
			provider: PaymentProvider.Stripe,
			providerPaymentId: "pi_test_123",
			amount: 1000,
			currency: "INR",
			status: PaymentStatus.Completed,
			coinsGranted: 100,
			purpose: "coins",
			paymentType: "STRIPE",
			transactionOwner: "user",
			createdAt: new Date(),
		},
		overrides,
	);

	return new PaymentTransaction(
		data.id,
		data.userId,
		data.provider,
		data.providerPaymentId,
		data.amount,
		data.currency,
		data.status,
		data.coinsGranted,
		data.purpose,
		data.paymentType,
		data.createdAt,
		data.transactionOwner,
	);
}
