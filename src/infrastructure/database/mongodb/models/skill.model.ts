import { model, Schema, type Types } from "mongoose";

export interface SkillDocument {
	_id: Types.ObjectId;
	name: string;
	slug: string;
	interestId: Types.ObjectId;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const skillSchema = new Schema<SkillDocument>(
	{
		name: { type: String, required: true, unique: true },
		slug: { type: String, required: true, unique: true },
		interestId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "Interest",
		},
		isActive: { type: Boolean, required: true, default: false },
	},
	{ timestamps: true },
);

export const SkillModel = model<SkillDocument>("Skill", skillSchema);
