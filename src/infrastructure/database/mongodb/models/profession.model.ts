import { model, Schema, type Types } from "mongoose";

export interface ProfessionDocument {
	_id: Types.ObjectId;
	name: string;
	slug: string;
	isActive: boolean;
}

const professionSchema = new Schema<ProfessionDocument>(
	{
		name: { type: String, required: true, unique: true },
		slug: { type: String, required: true, unique: true },
		isActive: { type: Boolean, required: true, default: false },
	},
	{ timestamps: true },
);

export const ProfessionModel = model<ProfessionDocument>(
	"Profession",
	professionSchema,
);
