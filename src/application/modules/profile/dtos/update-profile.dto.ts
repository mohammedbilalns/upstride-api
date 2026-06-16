export interface UpdateProfileInput {
	userId: string;
	name?: string;
	profilePictureId?: string;
	interests?: string[];
	skills?: string[];
}
