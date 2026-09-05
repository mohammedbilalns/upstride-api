import { beforeEach, describe, expect, it } from "vitest";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import { GetProfileUseCase } from "../../../../../src/application/modules/profile/use-cases/get-profile.use-case";
import type { IStorageService } from "../../../../../src/application/services/storage.service.interface";
import type { IUserRepository } from "../../../../../src/domain/repositories";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetProfileUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let useCase: GetProfileUseCase;

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		storageService = createMock<IStorageService>();
		useCase = new GetProfileUseCase(userRepository, storageService);
		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
	});

	it("should throw when the profile is not found", async () => {
		userRepository.findProfileById.mockResolvedValue(null);

		await expect(useCase.execute({ userId: "user-1" })).rejects.toBeInstanceOf(
			UserNotFoundError,
		);
	});

	it("should return the mapped profile with grouped preferences", async () => {
		userRepository.findProfileById.mockResolvedValue({
			id: "user-1",
			name: "User One",
			email: "user@example.com",
			phone: "9999999999",
			coinBalance: 20,
			role: "USER",
			authType: "LOCAL",
			profilePictureId: "avatar-1",
			preferences: {
				interests: [{ id: { toString: () => "interest-1" }, name: "Backend" }],
				skills: [
					{
						skillId: {
							id: { toString: () => "skill-1" },
							name: "Node.js",
							interestId: { toString: () => "interest-1" },
						},
					},
				],
			},
		});

		const result = await useCase.execute({ userId: "user-1" });

		expect(result.profile.profilePictureUrl).toBe(
			"https://storage.example.com/avatar-1",
		);
		expect(result.profile.preferences?.interests[0]).toEqual(
			expect.objectContaining({
				id: "interest-1",
				name: "Backend",
				skills: [{ skillId: "skill-1", name: "Node.js" }],
			}),
		);
	});
});
