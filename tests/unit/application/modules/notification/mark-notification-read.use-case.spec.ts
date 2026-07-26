import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationNotFoundError } from "../../../../../src/application/modules/notification/errors";
import { MarkNotificationReadUseCase } from "../../../../../src/application/modules/notification/use-cases/mark-notification-read.use-case";
import type { INotificationRepository } from "../../../../../src/domain/repositories/notification.repository.interface";
import { createNotification } from "../../../../factories/entities/notification.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("MarkNotificationReadUseCase", () => {
	let notificationRepository: ReturnType<
		typeof createMock<INotificationRepository>
	>;
	let useCase: MarkNotificationReadUseCase;

	beforeEach(() => {
		notificationRepository = createMock<INotificationRepository>();
		useCase = new MarkNotificationReadUseCase(notificationRepository);
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-24T08:00:00.000Z"));
	});

	it("should throw when the notification does not belong to the user", async () => {
		notificationRepository.findById.mockResolvedValue(
			createNotification({ userId: "user-2" }),
		);

		await expect(
			useCase.execute({ userId: "user-1", notificationId: "notification-1" }),
		).rejects.toBeInstanceOf(NotificationNotFoundError);
	});

	it("should mark an unread notification as read", async () => {
		notificationRepository.findById.mockResolvedValue(createNotification());

		const result = await useCase.execute({
			userId: "user-1",
			notificationId: "notification-1",
		});

		expect(notificationRepository.updateById).toHaveBeenCalledWith(
			"notification-1",
			expect.objectContaining({
				isRead: true,
				readAt: expect.any(Date),
			}),
		);
		expect(result.notification.isRead).toBe(true);
	});

	it("should not update the repository when the notification is already read", async () => {
		notificationRepository.findById.mockResolvedValue(
			createNotification({
				isRead: true,
				readAt: new Date("2026-07-23T00:00:00Z"),
			}),
		);

		await useCase.execute({
			userId: "user-1",
			notificationId: "notification-1",
		});

		expect(notificationRepository.updateById).not.toHaveBeenCalled();
	});
});
