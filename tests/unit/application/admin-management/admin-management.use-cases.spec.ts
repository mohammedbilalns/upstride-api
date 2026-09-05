import { beforeEach, describe, expect, it } from "vitest";
import { BlockAdminUseCase } from "../../../../src/application/modules/admin-management/use-cases/block-admin.use-case";
import { CreateAdminUseCase } from "../../../../src/application/modules/admin-management/use-cases/create-admin.use-case";
import { GetAdminsUseCase } from "../../../../src/application/modules/admin-management/use-cases/get-admins.use-case";
import { UnblockAdminUseCase } from "../../../../src/application/modules/admin-management/use-cases/unblock-admin.use-case";
import { UserAlreadyExistsError } from "../../../../src/application/modules/authentication/errors/user-already-exists.error";
import type { IPasswordService } from "../../../../src/application/services/password.service.interface";
import type { IUserRepository } from "../../../../src/domain/repositories";
import { createUser } from "../../../factories/entities/user.factory";
import { createMock } from "../../../factories/utilities/create-mock";

describe("admin management use cases", () => {
	let userRepository: ReturnType<typeof createMock<IUserRepository>>;
	let passwordService: ReturnType<typeof createMock<IPasswordService>>;

	beforeEach(() => {
		userRepository = createMock<IUserRepository>();
		passwordService = createMock<IPasswordService>();
	});

	describe("BlockAdminUseCase", () => {
		it("blocks the admin by id", async () => {
			const useCase = new BlockAdminUseCase(userRepository);

			await useCase.execute({ adminId: "admin-1" });

			expect(userRepository.updateById).toHaveBeenCalledWith("admin-1", {
				isBlocked: true,
			});
		});
	});

	describe("UnblockAdminUseCase", () => {
		it("unblocks the admin by id", async () => {
			const useCase = new UnblockAdminUseCase(userRepository);

			await useCase.execute({ adminId: "admin-1" });

			expect(userRepository.updateById).toHaveBeenCalledWith("admin-1", {
				isBlocked: false,
			});
		});
	});

	describe("CreateAdminUseCase", () => {
		it("throws when a verified admin already exists", async () => {
			const useCase = new CreateAdminUseCase(userRepository, passwordService);
			userRepository.findByEmail.mockResolvedValue(
				createUser({ id: "admin-1", isVerified: true }),
			);

			await expect(
				useCase.execute({
					email: "admin@example.com",
					password: "secret",
				}),
			).rejects.toBeInstanceOf(UserAlreadyExistsError);

			expect(userRepository.deleteById).not.toHaveBeenCalled();
			expect(passwordService.hashPassword).not.toHaveBeenCalled();
		});

		it("replaces an unverified existing admin before creating a new one", async () => {
			const useCase = new CreateAdminUseCase(userRepository, passwordService);
			userRepository.findByEmail.mockResolvedValue(
				createUser({ id: "admin-1", isVerified: false }),
			);
			passwordService.hashPassword.mockResolvedValue("hashed-password");
			userRepository.create.mockResolvedValue(
				createUser({
					id: "admin-2",
					email: "admin@example.com",
					name: "Admin",
					role: "ADMIN",
				}),
			);

			const result = await useCase.execute({
				email: "admin@example.com",
				password: "secret",
			});

			expect(userRepository.deleteById).toHaveBeenCalledWith("admin-1");
			expect(passwordService.hashPassword).toHaveBeenCalledWith("secret");
			expect(userRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "admin@example.com",
					name: "admin",
					passwordHash: "hashed-password",
					role: "ADMIN",
					isVerified: true,
				}),
			);
			expect(result).toEqual({ newAdminId: "admin-2" });
		});
	});

	describe("GetAdminsUseCase", () => {
		it("returns the paginated admin list with admin stats", async () => {
			const useCase = new GetAdminsUseCase(userRepository);
			const admin = createUser({
				id: "admin-1",
				name: "Admin User",
				email: "admin@example.com",
				role: "ADMIN",
				isBlocked: false,
			});

			userRepository.paginate.mockResolvedValue({
				items: [admin],
				total: 1,
				page: 1,
				limit: 10,
				totalPages: 1,
			});
			userRepository.getStats.mockResolvedValue({
				totalUsers: 0,
				totalMentors: 0,
				totalAdmins: 3,
				activeAdmins: 2,
				blockedAdmins: 1,
			});

			const result = await useCase.execute({
				page: 1,
				limit: 10,
				search: "admin",
				status: "active",
				sort: "recent",
			});

			expect(userRepository.paginate).toHaveBeenCalledWith({
				page: 1,
				limit: 10,
				query: expect.objectContaining({
					role: "ADMIN",
					isBlocked: false,
				}),
				sort: { createdAt: -1 },
			});
			expect(result.admins).toEqual([
				expect.objectContaining({
					id: "admin-1",
					email: "admin@example.com",
					status: "active",
				}),
			]);
			expect(result.totalAdmins).toBe(3);
			expect(result.activeAdmins).toBe(2);
			expect(result.blockedAdmins).toBe(1);
		});
	});
});
