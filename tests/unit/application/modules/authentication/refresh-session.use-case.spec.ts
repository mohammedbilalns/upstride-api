import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RefreshSessionInput } from "../../../../../src/application/modules/authentication/dtos/session/refresh-session.dto";
import {
	AuthenticationError,
	UnauthorizedError,
	UserBlockedError,
} from "../../../../../src/application/modules/authentication/errors";
import { RefreshSessionUseCase } from "../../../../../src/application/modules/authentication/use-cases/refresh-session/refresh-session.use-case";
import type { ITokenService } from "../../../../../src/application/services";
import type { IIdGenerator } from "../../../../../src/application/services/id-generator.service.interface";
import type {
	ISessionRepository,
	IUserRepository,
} from "../../../../../src/domain/repositories";
import { createSession } from "../../../../factories/entities/session.factory";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("RefreshSessionUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let tokenService: ReturnType<typeof createMock<ITokenService>>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let useCase: RefreshSessionUseCase;

	const input: RefreshSessionInput = {
		refreshToken: "refresh-token",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		sessionRepository = createMock<ISessionRepository>();
		tokenService = createMock<ITokenService>();
		idGenerator = createMock<IIdGenerator>();

		useCase = new RefreshSessionUseCase(
			userRepository,
			sessionRepository,
			tokenService,
			idGenerator,
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should throw UnauthorizedError when refresh token is missing", async () => {
		await expect(useCase.execute({ refreshToken: "" })).rejects.toBeInstanceOf(
			UnauthorizedError,
		);
	});

	it("should throw UnauthorizedError when session does not exist", async () => {
		tokenService.verifyRefreshToken.mockResolvedValue({
			sub: "user-1",
			sid: "sid-1",
			jti: "jti-1",
		});
		sessionRepository.findBySid.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UnauthorizedError,
		);
		expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
			input.refreshToken,
		);
		expect(sessionRepository.findBySid).toHaveBeenCalledWith("sid-1");
	});

	it("should revoke the session when the refresh token hash does not match", async () => {
		tokenService.verifyRefreshToken.mockResolvedValue({
			sub: "user-1",
			sid: "sid-1",
			jti: "jti-1",
		});
		tokenService.hashToken.mockReturnValue("hashed-input");
		sessionRepository.findBySid.mockResolvedValue(
			createSession({ sid: "sid-1", refreshTokenHash: "stored-hash" }),
		);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UnauthorizedError,
		);

		expect(sessionRepository.revoke).toHaveBeenCalledWith("sid-1");
		expect(userRepository.findById).not.toHaveBeenCalled();
	});

	it("should throw UnauthorizedError when the session is expired", async () => {
		tokenService.verifyRefreshToken.mockResolvedValue({
			sub: "user-1",
			sid: "sid-1",
			jti: "jti-1",
		});
		tokenService.hashToken.mockReturnValue("stored-hash");
		sessionRepository.findBySid.mockResolvedValue(
			createSession({
				sid: "sid-1",
				refreshTokenHash: "stored-hash",
				expiresAt: new Date("2020-01-01T00:00:00.000Z"),
			}),
		);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UnauthorizedError,
		);

		expect(sessionRepository.revoke).not.toHaveBeenCalled();
		expect(userRepository.findById).not.toHaveBeenCalled();
	});

	it("should throw AuthenticationError when the user no longer exists", async () => {
		tokenService.verifyRefreshToken.mockResolvedValue({
			sub: "user-1",
			sid: "sid-1",
			jti: "jti-1",
		});
		tokenService.hashToken.mockReturnValue("stored-hash");
		sessionRepository.findBySid.mockResolvedValue(
			createSession({ sid: "sid-1", refreshTokenHash: "stored-hash" }),
		);
		userRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			AuthenticationError,
		);
	});

	it("should throw when the user is blocked", async () => {
		tokenService.verifyRefreshToken.mockResolvedValue({
			sub: "user-1",
			sid: "sid-1",
			jti: "jti-1",
		});
		tokenService.hashToken.mockReturnValue("stored-hash");
		sessionRepository.findBySid.mockResolvedValue(
			createSession({ sid: "sid-1", refreshTokenHash: "stored-hash" }),
		);
		userRepository.findById.mockResolvedValue(createUser({ isBlocked: true }));

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserBlockedError,
		);
	});

	it("should refresh the session when everything is valid", async () => {
		vi.spyOn(Date, "now").mockReturnValue(
			new Date("2030-01-01T00:00:00.000Z").getTime(),
		);

		tokenService.verifyRefreshToken.mockResolvedValue({
			sub: "user-1",
			sid: "sid-1",
			jti: "old-refresh-jti",
		});
		tokenService.hashToken.mockImplementation((token) =>
			token === input.refreshToken ? "stored-hash" : "new-refresh-hash",
		);
		sessionRepository.findBySid.mockResolvedValue(
			createSession({
				sid: "sid-1",
				userId: "user-1",
				refreshTokenHash: "stored-hash",
				expiresAt: new Date("2030-01-02T00:00:00.000Z"),
			}),
		);
		userRepository.findById.mockResolvedValue(createUser());
		idGenerator.generateMany.mockReturnValue(["access-jti", "refresh-jti"]);
		tokenService.generateRefreshToken.mockResolvedValue("new-refresh-token");
		tokenService.generateAccessToken.mockResolvedValue("new-access-token");

		const result = await useCase.execute(input);

		expect(result).toEqual({
			accessToken: "new-access-token",
			refreshToken: "new-refresh-token",
		});
		expect(idGenerator.generateMany).toHaveBeenCalledWith(2);
		expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
			sub: "user-1",
			jti: "refresh-jti",
			sid: "sid-1",
		});
		expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
			sub: "user-1",
			role: "USER",
			jti: "access-jti",
			sid: "sid-1",
		});
		expect(sessionRepository.updateBySid).toHaveBeenCalledWith("sid-1", {
			lastUsedAt: expect.any(Date),
			refreshTokenHash: "new-refresh-hash",
		});
	});
});
