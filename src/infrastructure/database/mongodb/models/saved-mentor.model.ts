import { model, Schema, type Types } from "mongoose";

export interface SavedMentorDocument {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	mentorId: Types.ObjectId;
	listId: Types.ObjectId;
	createdAt: Date;
}

const savedMentorSchema = new Schema<SavedMentorDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		mentorId: { type: Schema.Types.ObjectId, ref: "Mentor", required: true },
		listId: { type: Schema.Types.ObjectId, ref: "MentorList", required: true },
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

savedMentorSchema.index({ userId: 1, listId: 1, createdAt: -1 });
savedMentorSchema.index(
	{ userId: 1, mentorId: 1, listId: 1 },
	{ unique: true },
);

export const SavedMentorModel = model<SavedMentorDocument>(
	"SavedMentor",
	savedMentorSchema,
);
