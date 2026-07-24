import { beforeEach, describe, expect, it } from "vitest";
import { MarkAllNotificationsReadUseCase } from "../../../../src/application/modules/notification/use-cases/mark-all-notifications-read.use-case";
import type { INotificationRepository } from "../../../../src/domain/repositories/notification.repository.interface";
import { createMock } from "../../../factories/utilities/create-mock";

describe("MarkAllNotificationsReadUseCase", () => {
	let notificationRepository: ReturnType<
		typeof createMock<INotificationRepository>
	>;
	let useCase: MarkAllNotificationsReadUseCase;

	beforeEach(() => {
		notificationRepository = createMock<INotificationRepository>();
		useCase = new MarkAllNotificationsReadUseCase(notificationRepository);
	});

	it("should mark all notifications as read for the user", async () => {
		notificationRepository.markAllAsRead.mockResolvedValue(3);

		await expect(useCase.execute({ userId: "user-1" })).resolves.toEqual({
			updatedCount: 3,
		});
	});
});
