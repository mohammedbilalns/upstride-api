import { describe, expect, it } from "vitest";
import { Notification } from "../../../../src/domain/entities/notification.entity";

describe("Notification Entity", () => {
	it("should mark notification as read", () => {
		const now = new Date();
		const notif = new Notification(
			"notif-1",
			"user-1",
			"Title",
			"Description",
			"SESSION",
			"SESSION_BOOKED",
			now,
			false,
		);

		expect(notif.isRead).toBe(false);
		notif.markAsRead();
		expect(notif.isRead).toBe(true);
		expect(notif.readAt).toBeInstanceOf(Date);
	});

	it("should not change readAt if already read", () => {
		const now = new Date();
		const readTime = new Date(now.getTime() - 60000);
		const notif = new Notification(
			"notif-1",
			"user-1",
			"Title",
			"Description",
			"PAYMENT",
			"PAYMENT_SUCCESS",
			now,
			true,
			readTime,
		);

		const originalReadAt = notif.readAt;
		notif.markAsRead();
		expect(notif.readAt).toEqual(originalReadAt);
	});
});
