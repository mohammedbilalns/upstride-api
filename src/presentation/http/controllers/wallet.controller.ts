import { inject, injectable } from "inversify";
import type {
	IGetCoinBalanceUseCase,
	IGetCoinTransactionsUseCase,
	IGetPaymentTransactionsUseCase,
	IGetPlatformCoinTransactionsUseCase,
	IGetPlatformPaymentTransactionsUseCase,
	IGetPlatformWalletUseCase,
} from "../../../application/modules/wallet/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { WalletResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";
import type {
	CoinTransactionsQuery,
	PaymentTransactionsQuery,
} from "../validators/wallet.validator";

@injectable()
export class WalletController {
	constructor(
		@inject(TYPES.UseCases.GetCoinBalance)
		private readonly _getCoinBalanceUseCase: IGetCoinBalanceUseCase,
		@inject(TYPES.UseCases.GetCoinTransactions)
		private readonly _getCoinTransactionsUseCase: IGetCoinTransactionsUseCase,
		@inject(TYPES.UseCases.GetPaymentTransactions)
		private readonly _getPaymentTransactionsUseCase: IGetPaymentTransactionsUseCase,
		@inject(TYPES.UseCases.GetPlatformWallet)
		private readonly _getPlatformWalletUseCase: IGetPlatformWalletUseCase,
		@inject(TYPES.UseCases.GetPlatformCoinTransactions)
		private readonly _getPlatformCoinTransactionsUseCase: IGetPlatformCoinTransactionsUseCase,
		@inject(TYPES.UseCases.GetPlatformPaymentTransactions)
		private readonly _getPlatformPaymentTransactionsUseCase: IGetPlatformPaymentTransactionsUseCase,
	) {}

	getCoinBalance = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const data = await this._getCoinBalanceUseCase.execute({
			userId: req.user.id,
		});

		sendSuccess(res, HttpStatus.OK, {
			message: WalletResponseMessages.COIN_BALANCE_FETCHED,
			data,
		});
	});

	getCoinTransactions = asyncHandler(async (req: AuthenticatedRequest, res) => {
		const data = await this._getCoinTransactionsUseCase.execute({
			userId: req.user.id,
			...(req.validated.query as CoinTransactionsQuery),
		});

		sendSuccess(res, HttpStatus.OK, {
			message: WalletResponseMessages.COIN_TRANSACTIONS_FETCHED,
			data,
		});
	});

	getPaymentTransactions = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const data = await this._getPaymentTransactionsUseCase.execute({
				userId: req.user.id,
				...(req.validated.query as PaymentTransactionsQuery),
			});

			sendSuccess(res, HttpStatus.OK, {
				message: WalletResponseMessages.PAYMENT_TRANSACTIONS_FETCHED,
				data,
			});
		},
	);

	getPlatformWallet = asyncHandler(async (_req, res) => {
		const data = await this._getPlatformWalletUseCase.execute();

		sendSuccess(res, HttpStatus.OK, {
			message: WalletResponseMessages.PLATFORM_WALLET_FETCHED,
			data,
		});
	});

	getPlatformCoinTransactions = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const data = await this._getPlatformCoinTransactionsUseCase.execute({
				...(req.validated.query as CoinTransactionsQuery),
			});

			sendSuccess(res, HttpStatus.OK, {
				message: WalletResponseMessages.PLATFORM_COIN_TRANSACTIONS_FETCHED,
				data,
			});
		},
	);

	getPlatformPaymentTransactions = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const data = await this._getPlatformPaymentTransactionsUseCase.execute({
				...(req.validated.query as PaymentTransactionsQuery),
			});

			sendSuccess(res, HttpStatus.OK, {
				message: WalletResponseMessages.PLATFORM_PAYMENT_TRANSACTIONS_FETCHED,
				data,
			});
		},
	);
}
