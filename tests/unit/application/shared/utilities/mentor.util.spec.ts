import { beforeEach, describe, expect, it } from "vitest";
import { MentorNotFoundError } from "../../../../../src/application/shared/errors/mentor-not-found.error";
import { getMentorByUserIdOrThrow } from "../../../../../src/application/shared/utilities/mentor.util";
import type { IMentorWriteRepository } from "../../../../../src/domain/repositories/mentor-write.repository.interface";
import { createMentor } from "../../../../factories/entities/mentor.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("mentor.util", () => {
	describe("getMentorByUserIdOrThrow", () => {
		let repository: ReturnType<typeof createMock<IMentorWriteRepository>>;

		beforeEach(() => {
			repository = createMock<IMentorWriteRepository>();
		});

		it("should return the mentor when found", async () => {
			const mentor = createMentor({ userId: "user-1" });
			repository.findByUserId.mockResolvedValue(mentor);

			const result = await getMentorByUserIdOrThrow(repository, "user-1");

			expect(result).toBe(mentor);
			expect(repository.findByUserId).toHaveBeenCalledWith("user-1");
		});

		it("should throw MentorNotFoundError when mentor does not exist", async () => {
			repository.findByUserId.mockResolvedValue(null);

			await expect(
				getMentorByUserIdOrThrow(repository, "user-999"),
			).rejects.toBeInstanceOf(MentorNotFoundError);
		});

		it("should throw MentorNotFoundError with default message when no message is provided", async () => {
			repository.findByUserId.mockResolvedValue(null);

			await expect(
				getMentorByUserIdOrThrow(repository, "user-999"),
			).rejects.toThrow("Mentor not found");
		});

		it("should throw MentorNotFoundError with custom message when provided", async () => {
			repository.findByUserId.mockResolvedValue(null);

			await expect(
				getMentorByUserIdOrThrow(repository, "user-999", "Custom mentor error"),
			).rejects.toThrow("Custom mentor error");
		});
	});
});
