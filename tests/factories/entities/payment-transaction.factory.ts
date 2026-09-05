import {
	PaymentProvider,
	PaymentStatus,
	PaymentTransaction,
	type PaymentTransactionPurpose,
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
			providerPaymentId: "stripe-tx-1",
			amount: 10000,
			currency: "INR",
			status: PaymentStatus.Completed,
			coinsGranted: 100,
			purpose: "coins",
			paymentType: "STRIPE",
			createdAt: new Date(),
			transactionOwner: "user",
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
		data.purpose as PaymentTransactionPurpose,
		data.paymentType,
		data.createdAt,
		data.transactionOwner,
	);
}
