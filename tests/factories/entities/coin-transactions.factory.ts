import {
	CoinTransaction,
	CoinTransactionType,
} from "../../../src/domain/entities/coin-transactions.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createCoinTransaction(
	overrides: Partial<CoinTransaction> = {},
): CoinTransaction {
	const data = mergeDefaults<CoinTransaction>(
		{
			id: "coin-transaction-1",
			userId: "user-1",
			amount: 100,
			type: CoinTransactionType.Purchase,
			referenceType: undefined,
			referenceId: undefined,
			transactionOwner: "user",
			createdAt: new Date(),
		},
		overrides,
	);

	return new CoinTransaction(
		data.id,
		data.userId,
		data.amount,
		data.type,
		data.referenceType,
		data.referenceId,
		data.createdAt,
		data.transactionOwner,
	);
}
