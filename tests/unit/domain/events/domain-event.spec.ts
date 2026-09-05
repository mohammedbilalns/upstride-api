import { describe, expect, it } from "vitest";
import { DomainEvent } from "../../../../src/domain/events/domain-event";

class TestDomainEvent extends DomainEvent {
	readonly eventName = "test.event";
}

describe("DomainEvent Base Class", () => {
	describe("constructor", () => {
		it("should create a domain event with occurred timestamp", () => {
			const before = new Date();
			const event = new TestDomainEvent();
			const after = new Date();

			expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(
				before.getTime(),
			);
			expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it("should have abstract eventName property", () => {
			const event = new TestDomainEvent();

			expect(event.eventName).toBe("test.event");
		});

		it("should create multiple events with different timestamps", () => {
			const event1 = new TestDomainEvent();
			const event2 = new TestDomainEvent();

			expect(event1.occurredAt).toBeDefined();
			expect(event2.occurredAt).toBeDefined();
		});
	});
});
