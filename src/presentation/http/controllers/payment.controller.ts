import { inject, injectable } from "inversify";
import type {
	ICreateCheckoutSessionUseCase,
	IHandlePaymentWebhookUseCase,
} from "../../../application/modules/payment/use-cases";
import { HttpStatus } from "../../../shared/constants";
import type { AuthenticatedRequest } from "../../../shared/types/authenticated-request.type";
import { TYPES } from "../../../shared/types/types";
import { getClientBaseUrl } from "../../../shared/utilities/url.util";
import { PaymentResponseMessages } from "../constants";
import { asyncHandler, sendSuccess } from "../helpers";

interface CreateCheckoutSessionBody {
	coins: number;
	successPath?: string;
	cancelPath?: string;
}

@injectable()
export class PaymentController {
	constructor(
		@inject(TYPES.UseCases.CreateCheckoutSession)
		private readonly _createCheckoutSessionUseCase: ICreateCheckoutSessionUseCase,
		@inject(TYPES.UseCases.HandlePaymentWebhook)
		private readonly _handleStripeWebhookUseCase: IHandlePaymentWebhookUseCase,
	) {}

	createCheckoutSession = asyncHandler(
		async (req: AuthenticatedRequest, res) => {
			const coinsBody = (req.validated.body ??
				req.body) as CreateCheckoutSessionBody;
			const { coins } = coinsBody;
			const userId = req.user.id;

			const baseUrl = getClientBaseUrl();
			const hasQ = coinsBody.successPath?.includes("?");
			const successUrl = coinsBody.successPath
				? `${baseUrl}${coinsBody.successPath}${hasQ ? "&" : "?"}payment_success=true`
				: `${baseUrl}/coins?payment_success=true`;
			const cancelUrl = coinsBody.cancelPath
				? `${baseUrl}${coinsBody.cancelPath}`
				: `${baseUrl}/coins`;

			const session = await this._createCheckoutSessionUseCase.execute({
				userId,
				coins,
				successUrl,
				cancelUrl,
			});

			return sendSuccess(res, HttpStatus.OK, {
				message: PaymentResponseMessages.CHECKOUT_SESSION_CREATED,
				data: session,
			});
		},
	);

	handleStripeWebhook = asyncHandler(async (req, res) => {
		const signature = req.headers["stripe-signature"];
		if (!signature || Array.isArray(signature)) {
			res.status(HttpStatus.BAD_REQUEST).json({
				success: false,
				message: PaymentResponseMessages.MISSING_STRIPE_SIGNATURE,
			});
			return;
		}

		if (!Buffer.isBuffer(req.body)) {
			res.status(HttpStatus.BAD_REQUEST).json({
				success: false,
				message: PaymentResponseMessages.INVALID_WEBHOOK_PAYLOAD,
			});
			return;
		}

		await this._handleStripeWebhookUseCase.execute({
			signature,
			payload: req.body,
		});

		res.status(HttpStatus.OK).json({ received: true });
	});
}
