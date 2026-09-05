import { beforeEach, describe, expect, it } from "vitest";
import { GetNotificationsUseCase } from "../../../../../src/application/modules/notification/use-cases/get-notifications.use-case";
import type { INotificationRepository } from "../../../../../src/domain/repositories/notification.repository.interface";
import { createNotification } from "../../../../factories/entities/notification.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetNotificationsUseCase", () => {
	let notificationRepository: ReturnType<
		typeof createMock<INotificationRepository>
	>;
	let useCase: GetNotificationsUseCase;

	beforeEach(() => {
		notificationRepository = createMock<INotificationRepository>();
		useCase = new GetNotificationsUseCase(notificationRepository);
	});

	it("should paginate notifications with unread filter", async () => {
		notificationRepository.paginate.mockResolvedValue({
			items: [createNotification({ isRead: false })],
			total: 1,
			page: 2,
			limit: 10,
			totalPages: 1,
		});

		const result = await useCase.execute({
			userId: "user-1",
			page: 2,
			status: "unread",
		});

		expect(notificationRepository.paginate).toHaveBeenCalledWith({
			page: 2,
			limit: 10,
			query: { userId: "user-1", isRead: false },
			sort: { createdAt: -1 },
		});
		expect(result.notifications).toHaveLength(1);
	});
});
