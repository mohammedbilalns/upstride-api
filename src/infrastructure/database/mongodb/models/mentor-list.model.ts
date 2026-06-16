import { model, Schema, type Types } from "mongoose";

export interface MentorListDocument {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	name: string;
	description?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

const mentorListSchema = new Schema<MentorListDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		name: { type: String, required: true },
		description: { type: String },
	},
	{ timestamps: true },
);

mentorListSchema.index({ userId: 1, createdAt: -1 });

export const MentorListModel = model<MentorListDocument>(
	"MentorList",
	mentorListSchema,
);
