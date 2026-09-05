import { PlatformWallet } from "../../../src/domain/entities/platform-wallet.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createPlatformWallet(
	overrides: Partial<PlatformWallet> = {},
): PlatformWallet {
	const data = mergeDefaults<PlatformWallet>(
		{
			id: "wallet-1",
			balance: 100000,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new PlatformWallet(
		data.id,
		data.balance,
		data.createdAt,
		data.updatedAt,
	);
}
