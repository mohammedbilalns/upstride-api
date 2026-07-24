import { beforeEach, describe, expect, it } from "vitest";
import type { EventBus } from "../../../../src/application/events/event-bus.interface";
import { UnauthorizedError } from "../../../../src/application/modules/authentication/errors";
import { UpdateProfileUseCase } from "../../../../src/application/modules/profile/use-cases/update-profile.use-case";
import type { IStorageService } from "../../../../src/application/services/storage.service.interface";
import type { IUserRepository } from "../../../../src/domain/repositories";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("UpdateProfileUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let storageService: ReturnType<typeof createMock<IStorageService>>;
	let eventBus: ReturnType<typeof createMock<EventBus>>;
	let useCase: UpdateProfileUseCase;

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		storageService = createMock<IStorageService>();
		eventBus = createMock<EventBus>();
		useCase = new UpdateProfileUseCase(
			userRepository,
			storageService,
			eventBus,
		);
		storageService.getPublicUrl.mockImplementation(
			(id: string) => `https://storage.example.com/${id}`,
		);
	});

	it("should reject updates for the dummy login user", async () => {
		userRepository.findById.mockResolvedValue(
			createUser({ email: process.env.DUMMY_LOGIN_EMAIL }),
		);

		await expect(
			useCase.execute({ userId: "user-1", name: "Updated" }),
		).rejects.toBeInstanceOf(UnauthorizedError);
	});

	it("should update profile fields, preferences, and publish mentor profile updates", async () => {
		userRepository.findById.mockResolvedValue(
			createUser({
				role: "MENTOR",
				name: "Old Name",
				profilePictureId: "old-avatar",
				preferences: {
					interests: ["interest-old-1", "interest-old-2"],
					skills: [{ skillId: "skill-old-1" }, { skillId: "skill-old-2" }],
				},
			}),
		);

		await useCase.execute({
			userId: "user-1",
			name: "New Name",
			profilePictureId: "new-avatar",
			interests: ["interest-1", "interest-2"],
			skills: ["skill-1", "skill-2"],
		});

		expect(storageService.delete).toHaveBeenCalledWith("old-avatar");
		expect(userRepository.updateById).toHaveBeenCalledWith(
			"user-1",
			expect.objectContaining({
				name: "New Name",
				profilePictureId: "new-avatar",
				preferences: {
					interests: ["interest-1", "interest-2"],
					skills: [{ skillId: "skill-1" }, { skillId: "skill-2" }],
				},
			}),
		);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: {
					userId: "user-1",
					name: "New Name",
					interests: ["interest-1", "interest-2"],
					avatarUrl: "https://storage.example.com/new-avatar",
				},
			}),
		);
	});
});
