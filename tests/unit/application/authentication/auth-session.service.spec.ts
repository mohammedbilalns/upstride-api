import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionService } from "../../../../src/application/modules/authentication/services/auth-session.service";
import {
	type IIdGenerator,
	type IStorageService,
	type ITokenService,
	REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from "../../../../src/application/services";
import type { ISessionRepository } from "../../../../src/domain/repositories";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("AuthSessionService", () => {
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let tokenService: ReturnType<typeof createMock<ITokenService>>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let service: AuthSessionService;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-24T12:00:00.000Z"));

		sessionRepository = createMock<ISessionRepository>();
		tokenService = createMock<ITokenService>();
		idGenerator = createMock<IIdGenerator>();
		storageService = createMock<IStorageService>();

		service = new AuthSessionService(
			sessionRepository,
			tokenService,
			idGenerator,
			storageService,
		);

		idGenerator.generateMany.mockReturnValue([
			"sid-1",
			"refresh-jti",
			"access-jti",
		]);
		tokenService.generateAccessToken.mockResolvedValue("access-token");
		tokenService.generateRefreshToken.mockResolvedValue("refresh-token");
		tokenService.hashToken.mockReturnValue("hashed-refresh-token");
	});

	it("creates a login response and persists a session", async () => {
		const user = createUser({
			id: "user-1",
			role: "MENTOR",
			coinBalance: 230,
			authType: "LOCAL",
		});

		const result = await service.createLoginResponse(user, {
			ipAddress: "10.0.0.1",
			userAgent: "Mozilla",
			browser: "Chrome",
			deviceVendor: "Apple",
			deviceModel: "MacBook",
			deviceOs: "macOS",
			deviceType: "desktop",
		});

		expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
			sub: "user-1",
			role: "MENTOR",
			jti: "access-jti",
			sid: "sid-1",
		});
		expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
			sub: "user-1",
			jti: "refresh-jti",
			sid: "sid-1",
		});
		expect(sessionRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				sid: "sid-1",
				userId: "user-1",
				refreshTokenHash: "hashed-refresh-token",
				ipAddress: "10.0.0.1",
				userAgent: "Mozilla",
				deviceName: "Chrome on Apple MacBook macOS",
				deviceType: "desktop",
				expiresAt: new Date(
					Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
				),
			}),
		);
		expect(result).toEqual({
			user: {
				id: "user-1",
				name: user.name,
				role: "MENTOR",
				coinBalance: 230,
				profilePictureUrl: null,
				isLocalAuth: true,
			},
			accessToken: "access-token",
			refreshToken: "refresh-token",
		});
	});

	it("includes a public profile picture URL when the user has one", async () => {
		const user = createUser({
			id: "user-1",
			profilePictureId: "avatars/user-1.png",
		});
		storageService.getPublicUrl.mockReturnValue(
			"https://cdn.example.com/avatar.png",
		);

		const result = await service.createLoginResponse(user, {});

		expect(storageService.getPublicUrl).toHaveBeenCalledWith(
			"avatars/user-1.png",
		);
		expect(result.user.profilePictureUrl).toBe(
			"https://cdn.example.com/avatar.png",
		);
	});
});
