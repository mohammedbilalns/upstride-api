import type {
	AuthType,
	UserRole,
} from "../../../../domain/entities/user.entity";

export interface GetProfileInput {
	userId: string;
}

export interface UserProfileDTO {
	id: string;
	name: string;
	email: string;
	phone: string;
	coinBalance: number;
	role: UserRole;
	authType: AuthType;
	profilePictureUrl: string | null;
	preferences?: {
		interests: {
			id: string;
			name: string;
			skills: {
				skillId: string;
				name: string;
			}[];
		}[];
	};
}

export interface GetProfileOutput {
	profile: UserProfileDTO;
}
