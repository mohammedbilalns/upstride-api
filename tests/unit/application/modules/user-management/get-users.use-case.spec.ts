import { beforeEach, describe, expect, it } from "vitest";
import type { GetUsersInput } from "../../../../../src/application/modules/user-management/dtos/get-users.dto";
import { GetUsersUseCase } from "../../../../../src/application/modules/user-management/use-cases/get-users.use-case";
import type { IUserRepository } from "../../../../../src/domain/repositories";
import { createUser } from "../../../../factories/entities/user.factory";
import { createMock } from "../../../../factories/utilities/create-mock";

describe("GetUsersUseCase", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let useCase: GetUsersUseCase;

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		useCase = new GetUsersUseCase(userRepository);
	});

	const baseInput: GetUsersInput = {
		page: 1,
		limit: 10,
	};

	it("should paginate users with default role and recent sort", async () => {
		const users = [
			createUser({
				id: "user-1",
				name: "User One",
				email: "user1@example.com",
				role: "USER",
				coinBalance: 10,
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
				isBlocked: false,
			}),
			createUser({
				id: "user-2",
				name: "Mentor One",
				email: "mentor1@example.com",
				role: "MENTOR",
				coinBalance: 50,
				createdAt: new Date("2026-01-02T00:00:00.000Z"),
				isBlocked: true,
			}),
		];
		userRepository.paginate.mockResolvedValue({
			items: users,
			total: 2,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
		userRepository.getStats.mockResolvedValue({
			totalUsers: 20,
			totalMentors: 8,
			totalAdmins: 2,
			activeAdmins: 2,
			blockedAdmins: 0,
		});

		const result = await useCase.execute(baseInput);

		expect(userRepository.paginate).toHaveBeenCalledWith({
			page: 1,
			limit: 10,
			query: {
				search: undefined,
				role: ["USER", "MENTOR"],
				isBlocked: undefined,
			},
			sort: { createdAt: -1 },
		});
		expect(userRepository.getStats).toHaveBeenCalledOnce();
		expect(result).toEqual({
			users: [
				{
					id: "user-1",
					name: "User One",
					email: "user1@example.com",
					role: "USER",
					coinBalance: 10,
					joinedAt: new Date("2026-01-01T00:00:00.000Z"),
					status: "active",
				},
				{
					id: "user-2",
					name: "Mentor One",
					email: "mentor1@example.com",
					role: "MENTOR",
					coinBalance: 50,
					joinedAt: new Date("2026-01-02T00:00:00.000Z"),
					status: "blocked",
				},
			],
			total: 2,
			page: 1,
			limit: 10,
			totalPages: 1,
			totalUsers: 20,
			totalMentors: 8,
		});
	});

	it("should build filters from the input", async () => {
		userRepository.paginate.mockResolvedValue({
			items: [],
			total: 0,
			page: 2,
			limit: 5,
			totalPages: 0,
		});
		userRepository.getStats.mockResolvedValue({
			totalUsers: 0,
			totalMentors: 0,
			totalAdmins: 0,
			activeAdmins: 0,
			blockedAdmins: 0,
		});

		await useCase.execute({
			page: 2,
			limit: 5,
			search: "alice",
			role: "USER",
			status: "blocked",
			sort: "old",
		});

		expect(userRepository.paginate).toHaveBeenCalledWith({
			page: 2,
			limit: 5,
			query: {
				search: "alice",
				role: "USER",
				isBlocked: true,
			},
			sort: { createdAt: 1 },
		});
	});
});
