import type { LoginResponse } from "../../../src/application/modules/authentication/dtos";
import { createUser } from "../entities/user.factory";

export function createLoginResponse(
	overrides: Partial<LoginResponse> = {},
): LoginResponse {
	const user = createUser();

	return {
		accessToken: "access-token",
		refreshToken: "refresh-token",
		user: {
			id: user.id,
			name: user.name,
			role: user.role,
			coinBalance: user.coinBalance,
			profilePictureUrl: null,
			isLocalAuth: user.authType === "LOCAL",
		},
		...overrides,
	};
}
