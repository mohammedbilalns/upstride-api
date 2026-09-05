import { describe, expect, it } from "vitest";
import { ProfileUpdatedEvent } from "../../../../src/domain/events/profile-updated.event";

describe("ProfileUpdatedEvent", () => {
	it("should have correct properties", () => {
		const event = new ProfileUpdatedEvent({
			userId: "user-1",
			name: "John Doe",
			interests: ["tech"],
		});

		expect(event.eventName).toBe("profile.updated");
		expect(event.payload.name).toBe("John Doe");
		expect(event.occurredAt).toBeInstanceOf(Date);
	});
});
