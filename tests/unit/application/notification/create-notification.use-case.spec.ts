import { beforeEach, describe, expect, it } from "vitest";
import type { EventBus } from "../../../../src/application/events/event-bus.interface";
import { CreateNotificationUseCase } from "../../../../src/application/modules/notification/use-cases/create-notification.use-case";
import type { IIdGenerator } from "../../../../src/application/services/id-generator.service.interface";
import type { INotificationRepository } from "../../../../src/domain/repositories/notification.repository.interface";
import { createNotification } from "../../../factories/entities/notification.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("CreateNotificationUseCase", () => {
	let notificationRepository: ReturnType<
		typeof createMock<INotificationRepository>
	>;
	let idGenerator: ReturnType<typeof createMock<IIdGenerator>>;
	let eventBus: ReturnType<typeof createMock<EventBus>>;
	let useCase: CreateNotificationUseCase;

	beforeEach(() => {
		notificationRepository = createMock<INotificationRepository>();
		idGenerator = createMock<IIdGenerator>();
		eventBus = createMock<EventBus>();

		useCase = new CreateNotificationUseCase(
			notificationRepository,
			idGenerator,
			eventBus,
		);

		idGenerator.generate.mockReturnValue("notification-1");
		notificationRepository.create.mockImplementation(async (notification) =>
			createNotification({
				...notification,
				id: notification.id,
				userId: notification.userId,
				title: notification.title,
			}),
		);
	});

	it("should create a notification and publish the domain event", async () => {
		const result = await useCase.execute({
			userId: "user-1",
			title: "Report Update",
			description: "Your report has been resolved.",
			type: "REPORT",
			event: "REPORT_STATUS_UPDATED",
			metadata: { reportId: "report-1" },
			deliveryStatus: { inApp: true },
			actorId: "admin-1",
			relatedEntityId: "report-1",
		});

		expect(notificationRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "notification-1",
				userId: "user-1",
				title: "Report Update",
			}),
		);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					userId: "user-1",
					notification: expect.objectContaining({
						id: "notification-1",
						event: "REPORT_STATUS_UPDATED",
					}),
				}),
			}),
		);
		expect(result.notification.relatedEntityId).toBe("report-1");
	});
});
