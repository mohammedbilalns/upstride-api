import { describe, expect, it } from "vitest";
import { UserRegisteredEvent } from "../../../../src/domain/events/user-registered.event";
import { UserStatusChangedEvent } from "../../../../src/domain/events/user-status-changed.event";

describe("User Domain Events", () => {
	it("UserRegisteredEvent should have correct properties", () => {
		const event = new UserRegisteredEvent({
			userId: "user-1",
			email: "user@example.com",
		});

		expect(event.eventName).toBe("user.registered");
		expect(event.payload.email).toBe("user@example.com");
		expect(event.occurredAt).toBeInstanceOf(Date);
	});

	it("UserStatusChangedEvent should have correct properties", () => {
		const event = new UserStatusChangedEvent({
			userId: "user-1",
			isBlocked: true,
		});

		expect(event.eventName).toBe("user.status.changed");
		expect(event.payload.isBlocked).toBe(true);
		expect(event.occurredAt).toBeInstanceOf(Date);
	});

	it("sequential user events should have increasing or equal timestamps", () => {
		const event1 = new UserRegisteredEvent({
			userId: "u-1",
			email: "u@e.com",
		});
		const event2 = new UserStatusChangedEvent({
			userId: "u-1",
			isBlocked: false,
		});

		expect(event2.occurredAt.getTime()).toBeGreaterThanOrEqual(
			event1.occurredAt.getTime(),
		);
	});

	it("should create independent event instances", () => {
		const event1 = new UserStatusChangedEvent({
			userId: "u-1",
			isBlocked: true,
		});
		const event2 = new UserStatusChangedEvent({
			userId: "u-2",
			isBlocked: false,
		});

		expect(event1.payload.userId).not.toBe(event2.payload.userId);
		expect(event1.payload.isBlocked).not.toBe(event2.payload.isBlocked);
	});
});
