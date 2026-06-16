import { model, Schema, type Types } from "mongoose";
import {
	type AuthType,
	AuthTypeValues,
	type UserRole,
	UserRoleValues,
} from "../../../../domain/entities/user.entity";

export interface UserDocument {
	_id: Types.ObjectId;
	name: string;
	email: string;
	googleId: string | null;
	linkedinId: string | null;
	phone?: string;
	coinBalance: number;
	passwordHash: string;
	authType: AuthType;
	profilePictureId: string | null;
	role: UserRole;
	isBlocked: boolean;
	isVerified: boolean;
	preferences?: {
		interests: Types.ObjectId[];
		skills: {
			skillId: Types.ObjectId;
		}[];
	};
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		googleId: { type: String, default: null },
		linkedinId: { type: String, default: null },
		phone: { type: String },
		coinBalance: { type: Number, required: true, default: 0 },
		passwordHash: { type: String },
		authType: { type: String, enum: AuthTypeValues },
		profilePictureId: { type: String },
		role: { type: String, enum: UserRoleValues, required: true },
		isBlocked: { type: Boolean, required: true, default: false },
		isVerified: { type: Boolean, required: true, default: false },
		preferences: {
			interests: [{ type: Schema.Types.ObjectId, ref: "Interest" }],
			skills: [
				{
					skillId: {
						type: Schema.Types.ObjectId,
						ref: "Skill",
						required: true,
					},
				},
			],
		},
	},
	{ timestamps: true },
);

userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ linkedinId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1, role: 1 });

export const UserModel = model<UserDocument>("User", userSchema);
