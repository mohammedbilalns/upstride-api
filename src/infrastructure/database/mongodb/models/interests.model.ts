import { model, Schema, type Types } from "mongoose";

export interface InterestDocument {
	_id: Types.ObjectId;
	name: string;
	slug: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const interestsSchema = new Schema<InterestDocument>(
	{
		name: { type: String, required: true, unique: true },
		slug: { type: String, required: true, unique: true },
		isActive: { type: Boolean, required: true, default: false },
	},
	{ timestamps: true },
);

export const InterestModel = model<InterestDocument>(
	"Interest",
	interestsSchema,
);
