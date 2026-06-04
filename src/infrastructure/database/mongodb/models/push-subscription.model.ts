import { model, Schema, type Types } from "mongoose";

interface PushSubscriptionDocument {
	userId: Types.ObjectId;
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
	deviceType?: string;
	createdAt: Date;
	updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<PushSubscriptionDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		endpoint: { type: String, required: true, unique: true },
		keys: {
			p256dh: { type: String, required: true },
			auth: { type: String, required: true },
		},
		deviceType: { type: String },
	},
	{ timestamps: true },
);

pushSubscriptionSchema.index({ userId: 1 });

export const PushSubscriptionModel = model<PushSubscriptionDocument>(
	"PushSubscription",
	pushSubscriptionSchema,
);
