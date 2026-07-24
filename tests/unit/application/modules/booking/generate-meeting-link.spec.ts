import { describe, expect, it } from "vitest";
import { generateMeetingLink } from "../../../../../src/application/modules/booking/utils/generate-meeting-link";

describe("generate-meeting-link", () => {
	describe("generateMeetingLink", () => {
		it("should return a meeting link when payment status is COMPLETED", () => {
			const result = generateMeetingLink("booking-123", "COMPLETED");

			expect(result).toBe("http://localhost:5173/call/booking-123");
		});

		it("should return PENDING when payment status is not COMPLETED", () => {
			const result = generateMeetingLink("booking-123", "PENDING");

			expect(result).toBe("PENDING");
		});

		it("should return PENDING for FAILED payment status", () => {
			const result = generateMeetingLink("booking-123", "FAILED");

			expect(result).toBe("PENDING");
		});

		it("should return PENDING for REFUNDED payment status", () => {
			const result = generateMeetingLink("booking-123", "REFUNDED");

			expect(result).toBe("PENDING");
		});

		it("should include the booking ID in the meeting link", () => {
			const result = generateMeetingLink("my-special-booking", "COMPLETED");

			expect(result).toContain("my-special-booking");
		});
	});
});
