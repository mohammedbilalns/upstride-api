import { User } from "../../../src/domain/entities/user.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createUser(overrides: Partial<User> = {}): User {
	const data = mergeDefaults(
		{
			id: "user-1",
			name: "Test User",
			email: "test@example.com",
			googleId: "testgoogleid",
			linkedinId: "testlinkedinid",
			phone: "3233232323",
			coinBalance: 323,
			passwordHash: "$sdnwefewf",
			authType: "LOCAL",
			profilePictureId: null,
			role: "USER",
			isBlocked: false,
			isVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			preferences: undefined,
		},
		overrides,
	);
	return new User(
		data.id,
		data.name,
		data.email,
		data.googleId,
		data.linkedinId,
		data.phone,
		data.coinBalance,
		data.passwordHash,
		data.authType,
		data.profilePictureId,
		data.role,
		data.isBlocked,
		data.isVerified,
		data.createdAt,
		data.updatedAt,
		data.preferences,
	);
}
