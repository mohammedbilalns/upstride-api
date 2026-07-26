import { describe, expect, it } from "vitest";
import { NotificationCreatedEvent } from "../../../../src/domain/events/notification-created.event";

describe("NotificationCreatedEvent", () => {
	it("should have correct properties", () => {
		const now = new Date();
		const event = new NotificationCreatedEvent({
			userId: "user-1",
			notification: {
				id: "notif-1",
				userId: "user-1",
				title: "New Session",
				description: "Your session has been booked",
				type: "SESSION",
				event: "SESSION_BOOKED",
				isRead: false,
				createdAt: now,
			},
		});

		expect(event.eventName).toBe("notification.created");
		expect(event.payload.notification.title).toBe("New Session");
		expect(event.occurredAt).toBeInstanceOf(Date);
	});
});
