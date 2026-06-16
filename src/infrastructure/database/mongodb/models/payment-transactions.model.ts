import { model, Schema, type Types } from "mongoose";
import {
	PaymentProvider,
	PaymentStatus,
} from "../../../../domain/entities/payment-transactions.entity";

export interface PaymentTransactionDocument {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	paymentId: string;
	provider: PaymentProvider;
	providerPaymentId: string;
	amount: number;
	currency: string;
	status: PaymentStatus;
	coinsGranted: number;
	purpose: "coins" | "session";
	paymentType: "STRIPE" | "COINS";
	transactionOwner?: "platform" | "user" | "mentor";
	createdAt: Date;
	updatedAt: Date;
}

const paymentTransactionSchema = new Schema<PaymentTransactionDocument>(
	{
		userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
		paymentId: { type: String, required: true },
		provider: {
			type: String,
			enum: Object.values(PaymentProvider),
			required: true,
		},
		providerPaymentId: { type: String, required: true },
		amount: { type: Number, required: true },
		currency: { type: String, required: true },
		status: {
			type: String,
			enum: Object.values(PaymentStatus),
			required: true,
		},
		coinsGranted: { type: Number, required: true },
		purpose: { type: String, enum: ["coins", "session"], required: true },
		paymentType: { type: String, enum: ["STRIPE", "COINS"], required: true },
		transactionOwner: { type: String, enum: ["platform", "user", "mentor"] },
	},
	{ timestamps: true },
);

paymentTransactionSchema.index(
	{ providerPaymentId: 1, transactionOwner: 1 },
	{ unique: true, sparse: true },
);
paymentTransactionSchema.index(
	{ paymentId: 1, transactionOwner: 1 },
	{ unique: true, sparse: true },
);

paymentTransactionSchema.index({ userId: 1, createdAt: -1 });

export const PaymentTransactionModel = model<PaymentTransactionDocument>(
	"PaymentTransaction",
	paymentTransactionSchema,
);
