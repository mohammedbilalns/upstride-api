import { beforeEach, describe, expect, it } from "vitest";
import { GetUnreadNotificationCountUseCase } from "../../../../src/application/modules/notification/use-cases/get-unread-notification-count.use-case";
import type { INotificationRepository } from "../../../../src/domain/repositories/notification.repository.interface";
import { createMock } from "../../../factories/utilities/create-mock";

describe("GetUnreadNotificationCountUseCase", () => {
	let notificationRepository: ReturnType<
		typeof createMock<INotificationRepository>
	>;
	let useCase: GetUnreadNotificationCountUseCase;

	beforeEach(() => {
		notificationRepository = createMock<INotificationRepository>();
		useCase = new GetUnreadNotificationCountUseCase(notificationRepository);
	});

	it("should return the unread notification count", async () => {
		notificationRepository.countUnread.mockResolvedValue(4);

		await expect(useCase.execute({ userId: "user-1" })).resolves.toEqual({
			count: 4,
		});
	});
});
