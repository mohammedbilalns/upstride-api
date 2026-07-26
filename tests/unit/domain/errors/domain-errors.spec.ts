import { describe, expect, it } from "vitest";
import { EntityValidationError } from "../../../../src/domain/errors/entity-validation.error";

describe("Domain Errors", () => {
	describe("EntityValidationError", () => {
		it("should format message with entity name", () => {
			const error = new EntityValidationError("Article", "Invalid tags");
			expect(error.message).toContain("Article");
			expect(error.message).toContain("Invalid tags");
		});

		it("should have status code 400", () => {
			const error = new EntityValidationError("Entity", "message");
			expect(error.statusCode).toBe(400);
		});

		it("should extend Error", () => {
			const error = new EntityValidationError("E", "msg");
			expect(error).toBeInstanceOf(Error);
		});

		it("should be throwable", () => {
			expect(() => {
				throw new EntityValidationError("E", "msg");
			}).toThrow(EntityValidationError);
		});
	});

	describe("error hierarchy", () => {
		it("should catch EntityValidationError as Error", () => {
			expect(() => {
				try {
					throw new EntityValidationError("E", "m");
				} catch (e) {
					if (e instanceof Error) {
						throw e;
					}
				}
			}).toThrow(Error);
		});
	});
});
