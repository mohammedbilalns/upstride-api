import { describe, expect, it } from "vitest";
import { validateBreaks } from "../../../../src/domain/utilties/validate-availability-breaktime";

describe("validateBreaks Utility", () => {
	describe("valid breaks", () => {
		it("should allow empty breaks", () => {
			const result = validateBreaks([], "09:00", "17:00");
			expect(result).toBeNull();
		});

		it("should allow single break", () => {
			const result = validateBreaks(
				[{ startTime: "12:00", endTime: "13:00" }],
				"09:00",
				"17:00",
			);
			expect(result).toBeNull();
		});

		it("should allow multiple non-overlapping breaks", () => {
			const result = validateBreaks(
				[
					{ startTime: "10:00", endTime: "10:30" },
					{ startTime: "12:00", endTime: "12:30" },
					{ startTime: "14:00", endTime: "14:30" },
				],
				"09:00",
				"17:00",
			);
			expect(result).toBeNull();
		});

		it("should allow exactly 3 breaks", () => {
			const result = validateBreaks(
				[
					{ startTime: "10:00", endTime: "10:30" },
					{ startTime: "12:00", endTime: "12:30" },
					{ startTime: "14:00", endTime: "14:30" },
				],
				"09:00",
				"17:00",
			);
			expect(result).toBeNull();
		});

		it("should allow breaks at boundaries", () => {
			const result = validateBreaks(
				[{ startTime: "09:00", endTime: "10:00" }],
				"09:00",
				"17:00",
			);
			expect(result).toBeNull();
		});
	});

	describe("invalid breaks", () => {
		it("should reject more than 3 breaks", () => {
			const result = validateBreaks(
				[
					{ startTime: "10:00", endTime: "10:30" },
					{ startTime: "11:00", endTime: "11:30" },
					{ startTime: "12:00", endTime: "12:30" },
					{ startTime: "13:00", endTime: "13:30" },
				],
				"09:00",
				"17:00",
			);
			expect(result).not.toBeNull();
		});

		it("should reject break with start >= end", () => {
			const result = validateBreaks(
				[{ startTime: "13:00", endTime: "12:00" }],
				"09:00",
				"17:00",
			);
			expect(result).not.toBeNull();
		});

		it("should reject break outside window", () => {
			const result = validateBreaks(
				[{ startTime: "08:00", endTime: "10:00" }],
				"09:00",
				"17:00",
			);
			expect(result).not.toBeNull();
		});

		it("should reject overlapping breaks", () => {
			const result = validateBreaks(
				[
					{ startTime: "12:00", endTime: "13:00" },
					{ startTime: "12:30", endTime: "13:30" },
				],
				"09:00",
				"17:00",
			);
			expect(result).not.toBeNull();
		});
	});

	describe("edge cases", () => {
		it("should handle unsorted breaks", () => {
			const result = validateBreaks(
				[
					{ startTime: "14:00", endTime: "14:30" },
					{ startTime: "10:00", endTime: "10:30" },
					{ startTime: "12:00", endTime: "12:30" },
				],
				"09:00",
				"17:00",
			);
			expect(result).toBeNull();
		});

		it("should handle minutes in times", () => {
			const result = validateBreaks(
				[{ startTime: "12:15", endTime: "12:45" }],
				"09:00",
				"17:00",
			);
			expect(result).toBeNull();
		});

		it("should return error message string", () => {
			const result = validateBreaks(
				[
					{ startTime: "10:00", endTime: "10:30" },
					{ startTime: "11:00", endTime: "11:30" },
					{ startTime: "12:00", endTime: "12:30" },
					{ startTime: "13:00", endTime: "13:30" },
				],
				"09:00",
				"17:00",
			);
			expect(typeof result).toBe("string");
		});
	});
});
