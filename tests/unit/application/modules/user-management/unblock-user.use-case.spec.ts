import { beforeEach, describe, expect, it } from "vitest";
import type { EventBus } from "../../../../../src/application/events/event-bus.interface";
import { UserNotFoundError } from "../../../../../src/application/modules/authentication/errors";
import { UnblockUserUseCase } from "../../../../../src/application/modules/user-management/use-cases/unblock-user.use-case";
import type { IUserRepository } from "../../../../../src/domain/repositories";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("UnblockUserUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let eventBus: ReturnType<typeof createMock<EventBus>>;
	let useCase: UnblockUserUseCase;

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		eventBus = createMock<EventBus>();
		useCase = new UnblockUserUseCase(userRepository, eventBus);
	});

	it("should throw when the user does not exist", async () => {
		userRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute({ userId: "user-1" })).rejects.toBeInstanceOf(
			UserNotFoundError,
		);

		expect(userRepository.updateById).not.toHaveBeenCalled();
		expect(eventBus.publish).not.toHaveBeenCalled();
	});

	it("should unblock the user and publish an event", async () => {
		userRepository.findById.mockResolvedValue(
			createUser({ id: "user-1", isBlocked: true }),
		);

		const result = await useCase.execute({ userId: "user-1" });

		expect(result).toEqual({ resourceId: "user-1" });
		expect(userRepository.updateById).toHaveBeenCalledWith("user-1", {
			isBlocked: false,
		});
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: { userId: "user-1", isBlocked: false },
			}),
		);
	});
});
