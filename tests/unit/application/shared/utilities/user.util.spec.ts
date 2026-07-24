import { beforeEach, describe, expect, it } from "vitest";
import { UserNotFoundError } from "../../../../../src/application/shared/errors/user-not-found.error";
import {
	getUserByEmailOrThrow,
	getUserByIdOrThrow,
} from "../../../../../src/application/shared/utilities/user.util";
import type { IUserRepository } from "../../../../../src/domain/repositories/user.repository.interface";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("user.util", () => {
	let repository: ReturnType<typeof createMock<IUserRepository>>;

	beforeEach(() => {
		repository = createMock<IUserRepository>();
	});

	describe("getUserByIdOrThrow", () => {
		it("should return the user when found", async () => {
			const user = createUser({ id: "user-1" });
			repository.findById.mockResolvedValue(user);

			const result = await getUserByIdOrThrow(repository, "user-1");

			expect(result).toBe(user);
			expect(repository.findById).toHaveBeenCalledWith("user-1");
		});

		it("should throw UserNotFoundError when user does not exist", async () => {
			repository.findById.mockResolvedValue(null);

			await expect(
				getUserByIdOrThrow(repository, "user-999"),
			).rejects.toBeInstanceOf(UserNotFoundError);
		});

		it("should throw UserNotFoundError with default message when no message is provided", async () => {
			repository.findById.mockResolvedValue(null);

			await expect(getUserByIdOrThrow(repository, "user-999")).rejects.toThrow(
				"User not found",
			);
		});

		it("should throw UserNotFoundError with custom message when provided", async () => {
			repository.findById.mockResolvedValue(null);

			await expect(
				getUserByIdOrThrow(repository, "user-999", "Custom user error"),
			).rejects.toThrow("Custom user error");
		});
	});

	describe("getUserByEmailOrThrow", () => {
		it("should return the user when found by email", async () => {
			const user = createUser({ email: "test@example.com" });
			repository.findByEmail.mockResolvedValue(user);

			const result = await getUserByEmailOrThrow(
				repository,
				"test@example.com",
			);

			expect(result).toBe(user);
			expect(repository.findByEmail).toHaveBeenCalledWith("test@example.com");
		});

		it("should throw UserNotFoundError when user email does not exist", async () => {
			repository.findByEmail.mockResolvedValue(null);

			await expect(
				getUserByEmailOrThrow(repository, "missing@example.com"),
			).rejects.toBeInstanceOf(UserNotFoundError);
		});

		it("should throw UserNotFoundError with default message when no message is provided", async () => {
			repository.findByEmail.mockResolvedValue(null);

			await expect(
				getUserByEmailOrThrow(repository, "missing@example.com"),
			).rejects.toThrow("User not found");
		});

		it("should throw UserNotFoundError with custom message when provided", async () => {
			repository.findByEmail.mockResolvedValue(null);

			await expect(
				getUserByEmailOrThrow(
					repository,
					"missing@example.com",
					"No user with that email",
				),
			).rejects.toThrow("No user with that email");
		});
	});
});
