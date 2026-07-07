import { beforeEach, describe, expect, it } from "vitest";
import type { SaveUserInterestsInput } from "../../../../src/application/modules/authentication/dtos/preferences/save-user-interests.dto";
import { UserNotFoundError } from "../../../../src/application/modules/authentication/errors";
import { AuthenticationError } from "../../../../src/application/modules/authentication/errors/authentication.error";
import { SaveUserInterestsUseCase } from "../../../../src/application/modules/authentication/use-cases/save-user-interests/save-user-interests.use-case";
import type { ITokenService } from "../../../../src/application/services";
import type { IIdGenerator } from "../../../../src/application/services/id-generator.service.interface";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type {
	ISessionRepository,
	IUserRepository,
} from "../../../../src/domain/repositories";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("SaveUserInterestsUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let sessionRepository: ReturnType<typeof createMock<ISessionRepository>>;
	let tokenService: ReturnType<typeof createMock<ITokenService>>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: SaveUserInterestsUseCase;

	const input: SaveUserInterestsInput = {
		setupToken: "valid-setup-token",
		interests: ["tech", "finance"],
		skills: ["javascript", "react"],
		deviceType: "mobile",
		deviceVendor: "Apple",
		deviceModel: "iPhone 15",
		deviceOs: "iOS 17",
		ipAddress: "192.168.1.1",
		userAgent: "Mozilla/5.0",
		browser: "Safari",
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		sessionRepository = createMock<ISessionRepository>();
		tokenService = createMock<ITokenService>();
		idGenerator = createMock<IIdGenerator>();
		storageService = createMock<IStorageService>();

		useCase = new SaveUserInterestsUseCase(
			userRepository,
			sessionRepository,
			tokenService,
			idGenerator,
			storageService,
		);
	});

	it("should throw AuthenticationError when setup token is invalid", async () => {
		tokenService.verifySetupToken.mockResolvedValue({ sub: "" });

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			AuthenticationError,
		);
	});

	it("should throw UserNotFoundError when user does not exist", async () => {
		tokenService.verifySetupToken.mockResolvedValue({ sub: "user-1" });
		userRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should save user interests and return login response", async () => {
		const user = createUser({
			id: "user-1",
			email: "test@example.com",
			name: "Test User",
			role: "USER",
			profilePictureId: "pic-123",
		});
		tokenService.verifySetupToken.mockResolvedValue({ sub: user.id });
		userRepository.findById.mockResolvedValue(user);
		userRepository.updateById.mockResolvedValue({
			...user,
			preferences: {
				interests: input.interests,
				skills: input.skills.map((s) => ({ skillId: s })),
			},
		});
		idGenerator.generate.mockReturnValueOnce("refresh-token-id");
		idGenerator.generate.mockReturnValueOnce("access-token-id");
		idGenerator.generate.mockReturnValueOnce("session-id");
		tokenService.generateAccessToken.mockResolvedValue("access-token");
		tokenService.generateRefreshToken.mockResolvedValue("refresh-token");
		tokenService.hashToken.mockReturnValue("hashed-refresh-token");
		sessionRepository.create.mockResolvedValue(undefined);
		storageService.getPublicUrl.mockReturnValue(
			"https://example.com/avatar.jpg",
		);

		const result = await useCase.execute(input);

		expect(userRepository.updateById).toHaveBeenCalledWith(user.id, {
			preferences: {
				interests: input.interests,
				skills: input.skills.map((s) => ({ skillId: s })),
			},
		});
		expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
			sub: user.id,
			role: user.role,
			jti: "access-token-id",
			sid: "session-id",
		});
		expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
			sub: user.id,
			jti: "refresh-token-id",
			sid: "session-id",
		});
		expect(sessionRepository.create).toHaveBeenCalled();
		expect(result).toHaveProperty("accessToken", "access-token");
		expect(result).toHaveProperty("refreshToken", "refresh-token");
		expect(result).toHaveProperty("user");
		expect(result.user).toHaveProperty(
			"profilePictureUrl",
			"https://example.com/avatar.jpg",
		);
	});

	it("should work without profile picture", async () => {
		const user = createUser({
			id: "user-1",
			email: "test@example.com",
			name: "Test User",
			role: "USER",
			profilePictureId: null,
		});
		tokenService.verifySetupToken.mockResolvedValue({ sub: user.id });
		userRepository.findById.mockResolvedValue(user);
		userRepository.updateById.mockResolvedValue(user);
		idGenerator.generate.mockReturnValueOnce("refresh-token-id");
		idGenerator.generate.mockReturnValueOnce("access-token-id");
		idGenerator.generate.mockReturnValueOnce("session-id");
		tokenService.generateAccessToken.mockResolvedValue("access-token");
		tokenService.generateRefreshToken.mockResolvedValue("refresh-token");
		tokenService.hashToken.mockReturnValue("hashed-refresh-token");
		sessionRepository.create.mockResolvedValue(undefined);

		const result = await useCase.execute(input);

		expect(storageService.getPublicUrl).not.toHaveBeenCalled();
		expect(result).toHaveProperty("user");
		expect(result.user.profilePictureUrl).toBeNull();
	});
});
