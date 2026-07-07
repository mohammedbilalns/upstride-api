import type { Mocked } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventBus } from "../../../../src/application/events/event-bus.interface";
import type {
	SocialIdentityDto,
	SocialLoginInput,
} from "../../../../src/application/modules/authentication/dtos";
import {
	AuthenticationError,
	UserBlockedError,
} from "../../../../src/application/modules/authentication/errors";
import type { IAuthSessionService } from "../../../../src/application/modules/authentication/services";
import { SocialLoginUseCase } from "../../../../src/application/modules/authentication/use-cases/login/social-login.use-case";
import type {
	IOAuthIdentityProvider,
	ITokenService,
} from "../../../../src/application/services";
import type { IUserRepository } from "../../../../src/domain/repositories";
import { createLoginResponse } from "../../../factories/dtos/login-response.factory";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("SocialLoginUseCase", () => {
	let userRepository: Mocked<IUserRepository>;
	let googleOauthProvider: Mocked<IOAuthIdentityProvider>;
	let linkedInOauthProvider: Mocked<IOAuthIdentityProvider>;
	let tokenService: Mocked<ITokenService>;
	let authSessionService: Mocked<IAuthSessionService>;
	let eventBus: Mocked<EventBus>;

	let useCase: SocialLoginUseCase;

	const googleInput: SocialLoginInput = {
		provider: "GOOGLE",
		credential: "google-credential",
		ipAddress: "127.0.0.1",
	};

	const linkedInInput: SocialLoginInput = {
		provider: "LINKEDIN",
		credential: "linkedin-credential",
		ipAddress: "127.0.0.1",
	};

	const googleIdentity: SocialIdentityDto = {
		email: "google@example.com",
		name: "Google User",
		providerUserId: "google-user-1",
		authType: "GOOGLE",
		isVerified: true,
	};

	const linkedInIdentity: SocialIdentityDto = {
		email: "linkedin@example.com",
		name: "LinkedIn User",
		providerUserId: "linkedin-user-1",
		authType: "LINKEDIN",
		isVerified: true,
	};

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		googleOauthProvider = {
			provider: "GOOGLE",
			getIdentity: vi.fn(),
		} as unknown as Mocked<IOAuthIdentityProvider>;
		linkedInOauthProvider = {
			provider: "LINKEDIN",
			getIdentity: vi.fn(),
		} as unknown as Mocked<IOAuthIdentityProvider>;
		tokenService = createMock<ITokenService>();
		authSessionService = createMock<IAuthSessionService>();
		eventBus = createMock<EventBus>();

		useCase = new SocialLoginUseCase(
			userRepository,
			googleOauthProvider,
			linkedInOauthProvider,
			tokenService,
			authSessionService,
			eventBus,
		);
	});

	it("should throw AuthenticationError when provider is not supported", async () => {
		await expect(
			useCase.execute({
				provider: "FACEBOOK" as never,
				credential: "credential",
				ipAddress: "127.0.0.1",
			}),
		).rejects.toBeInstanceOf(AuthenticationError);

		expect(googleOauthProvider.getIdentity).not.toHaveBeenCalled();
		expect(linkedInOauthProvider.getIdentity).not.toHaveBeenCalled();
	});

	it("should login a google user already linked by provider id", async () => {
		const user = createUser({ authType: "GOOGLE" });
		const loginResponse = createLoginResponse();

		googleOauthProvider.getIdentity.mockResolvedValue(googleIdentity);
		userRepository.findByGoogleId.mockResolvedValue(user);
		authSessionService.createLoginResponse.mockResolvedValue(loginResponse);

		const result = await useCase.execute(googleInput);

		expect(result).toEqual(loginResponse);
		expect(googleOauthProvider.getIdentity).toHaveBeenCalledWith(
			googleInput.credential,
		);
		expect(userRepository.findByGoogleId).toHaveBeenCalledWith(
			googleIdentity.providerUserId,
		);
		expect(authSessionService.createLoginResponse).toHaveBeenCalledWith(
			user,
			googleInput,
		);
		expect(userRepository.findByEmail).not.toHaveBeenCalled();
		expect(tokenService.generateSetupToken).not.toHaveBeenCalled();
	});

	it("should login a linkedIn user already linked by provider id", async () => {
		const user = createUser({ authType: "LINKEDIN" });
		const loginResponse = createLoginResponse();

		linkedInOauthProvider.getIdentity.mockResolvedValue(linkedInIdentity);
		userRepository.findByLinkedinId.mockResolvedValue(user);
		authSessionService.createLoginResponse.mockResolvedValue(loginResponse);

		const result = await useCase.execute(linkedInInput);

		expect(result).toEqual(loginResponse);
		expect(linkedInOauthProvider.getIdentity).toHaveBeenCalledWith(
			linkedInInput.credential,
		);
		expect(userRepository.findByLinkedinId).toHaveBeenCalledWith(
			linkedInIdentity.providerUserId,
		);
		expect(authSessionService.createLoginResponse).toHaveBeenCalledWith(
			user,
			linkedInInput,
		);
	});

	it("should reject a blocked user linked by provider id", async () => {
		googleOauthProvider.getIdentity.mockResolvedValue(googleIdentity);
		userRepository.findByGoogleId.mockResolvedValue(
			createUser({ authType: "GOOGLE", isBlocked: true }),
		);

		await expect(useCase.execute(googleInput)).rejects.toBeInstanceOf(
			UserBlockedError,
		);

		expect(authSessionService.createLoginResponse).not.toHaveBeenCalled();
	});

	it("should reject when email belongs to a different social provider", async () => {
		googleOauthProvider.getIdentity.mockResolvedValue(googleIdentity);
		userRepository.findByGoogleId.mockResolvedValue(null);
		userRepository.findByEmail.mockResolvedValue(
			createUser({ authType: "LINKEDIN" }),
		);

		await expect(useCase.execute(googleInput)).rejects.toBeInstanceOf(
			AuthenticationError,
		);

		expect(userRepository.updateById).not.toHaveBeenCalled();
		expect(userRepository.create).not.toHaveBeenCalled();
	});

	it("should reject blocked users found by email", async () => {
		linkedInOauthProvider.getIdentity.mockResolvedValue(linkedInIdentity);
		userRepository.findByLinkedinId.mockResolvedValue(null);
		userRepository.findByEmail.mockResolvedValue(
			createUser({ authType: "LOCAL", isBlocked: true }),
		);

		await expect(useCase.execute(linkedInInput)).rejects.toBeInstanceOf(
			UserBlockedError,
		);

		expect(userRepository.updateById).not.toHaveBeenCalled();
		expect(userRepository.create).not.toHaveBeenCalled();
	});

	it("should reject unverified local users", async () => {
		googleOauthProvider.getIdentity.mockResolvedValue({
			...googleIdentity,
			isVerified: false,
		});
		userRepository.findByGoogleId.mockResolvedValue(null);
		userRepository.findByEmail.mockResolvedValue(
			createUser({ authType: "LOCAL", isVerified: true }),
		);

		await expect(useCase.execute(googleInput)).rejects.toBeInstanceOf(
			AuthenticationError,
		);

		expect(userRepository.updateById).not.toHaveBeenCalled();
		expect(authSessionService.createLoginResponse).not.toHaveBeenCalled();
	});

	it("should link a verified social account to an existing local user", async () => {
		const existingUser = createUser({
			authType: "LOCAL",
			googleId: null,
			linkedinId: null,
			isVerified: false,
		});
		const linkedUser = createUser({
			...existingUser,
			googleId: googleIdentity.providerUserId,
			isVerified: true,
		});
		const loginResponse = createLoginResponse();

		googleOauthProvider.getIdentity.mockResolvedValue(googleIdentity);
		userRepository.findByGoogleId.mockResolvedValue(null);
		userRepository.findByEmail.mockResolvedValue(existingUser);
		userRepository.updateById.mockResolvedValue(linkedUser);
		authSessionService.createLoginResponse.mockResolvedValue(loginResponse);

		const result = await useCase.execute(googleInput);

		expect(result).toEqual(loginResponse);
		expect(userRepository.updateById).toHaveBeenCalledWith(existingUser.id, {
			googleId: googleIdentity.providerUserId,
			linkedinId: existingUser.linkedinId,
			isVerified: true,
		});
		expect(authSessionService.createLoginResponse).toHaveBeenCalledWith(
			linkedUser,
			googleInput,
		);
	});

	it("should create a new social user and return a setup token", async () => {
		const createdUser = createUser({
			id: "user-new",
			authType: "GOOGLE",
			googleId: googleIdentity.providerUserId,
			linkedinId: null,
			email: googleIdentity.email,
			name: googleIdentity.name,
			isVerified: true,
		});

		googleOauthProvider.getIdentity.mockResolvedValue(googleIdentity);
		userRepository.findByGoogleId.mockResolvedValue(null);
		userRepository.findByEmail.mockResolvedValue(null);
		userRepository.create.mockResolvedValue(createdUser);
		tokenService.generateSetupToken.mockResolvedValue("setup-token");

		const result = await useCase.execute(googleInput);

		expect(result).toEqual({ setupToken: "setup-token" });
		expect(userRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				name: googleIdentity.name,
				email: googleIdentity.email,
				googleId: googleIdentity.providerUserId,
				linkedinId: null,
				phone: "",
				coinBalance: 0,
				authType: "GOOGLE",
				profilePictureId: null,
				role: "USER",
				isBlocked: false,
				isVerified: true,
			}),
		);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				eventName: "user.registered",
				payload: {
					userId: createdUser.id,
					email: createdUser.email,
				},
			}),
		);
		expect(tokenService.generateSetupToken).toHaveBeenCalledWith({
			sub: createdUser.id,
		});
		expect(authSessionService.createLoginResponse).not.toHaveBeenCalled();
	});
});
