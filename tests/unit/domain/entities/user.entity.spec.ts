import { describe, expect, it } from "vitest";
import {
	AuthTypeValues,
	User,
	UserRoleValues,
} from "../../../../src/domain/entities/user.entity";

describe("User Entity", () => {
	describe("constructor", () => {
		it("should create a valid user", () => {
			const now = new Date();
			const user = new User(
				"user-1",
				"John Doe",
				"john@example.com",
				"google-123",
				null,
				"+1234567890",
				100,
				"hashed-password",
				"GOOGLE",
				"profile-pic-1",
				"MENTOR",
				false,
				true,
				now,
				now,
				{
					interests: ["tech", "design"],
					skills: [{ skillId: "skill-1" }],
				},
			);

			expect(user.id).toBe("user-1");
			expect(user.name).toBe("John Doe");
			expect(user.email).toBe("john@example.com");
			expect(user.role).toBe("MENTOR");
			expect(user.isVerified).toBe(true);
			expect(user.coinBalance).toBe(100);
		});

		it("should create user with LOCAL auth type", () => {
			const now = new Date();
			const user = new User(
				"user-2",
				"Jane Doe",
				"jane@example.com",
				null,
				null,
				"+1234567890",
				50,
				"hashed-password",
				"LOCAL",
				null,
				"USER",
				false,
				true,
				now,
				now,
			);

			expect(user.authType).toBe("LOCAL");
			expect(user.googleId).toBeNull();
			expect(user.linkedinId).toBeNull();
		});

		it("should create user with optional preferences", () => {
			const now = new Date();
			const user = new User(
				"user-3",
				"Test User",
				"test@example.com",
				null,
				null,
				"+1234567890",
				0,
				"hashed-password",
				"LOCAL",
				null,
				"USER",
				false,
				false,
				now,
				now,
			);

			expect(user.preferences).toBeUndefined();
		});

		it("should allow ADMIN role", () => {
			const now = new Date();
			const user = new User(
				"admin-1",
				"Admin User",
				"admin@example.com",
				null,
				null,
				"+1234567890",
				0,
				"hashed-password",
				"LOCAL",
				null,
				"ADMIN",
				false,
				true,
				now,
				now,
			);

			expect(user.role).toBe("ADMIN");
		});

		it("should allow SUPER_ADMIN role", () => {
			const now = new Date();
			const user = new User(
				"super-admin-1",
				"Super Admin",
				"superadmin@example.com",
				null,
				null,
				"+1234567890",
				0,
				"hashed-password",
				"LOCAL",
				null,
				"SUPER_ADMIN",
				false,
				true,
				now,
				now,
			);

			expect(user.role).toBe("SUPER_ADMIN");
		});

		it("should create user with blocked status", () => {
			const now = new Date();
			const user = new User(
				"user-4",
				"Blocked User",
				"blocked@example.com",
				null,
				null,
				"+1234567890",
				0,
				"hashed-password",
				"LOCAL",
				null,
				"USER",
				true,
				true,
				now,
				now,
			);

			expect(user.isBlocked).toBe(true);
		});

		it("should create user with negative coin balance", () => {
			const now = new Date();
			const user = new User(
				"user-5",
				"Debt User",
				"debt@example.com",
				null,
				null,
				"+1234567890",
				-50,
				"hashed-password",
				"LOCAL",
				null,
				"USER",
				false,
				true,
				now,
				now,
			);

			expect(user.coinBalance).toBe(-50);
		});

		it("should store all auth types", () => {
			const now = new Date();
			AuthTypeValues.forEach((authType) => {
				const user = new User(
					`user-${authType}`,
					"Test User",
					"test@example.com",
					authType === "GOOGLE" ? "google-id" : null,
					authType === "LINKEDIN" ? "linkedin-id" : null,
					"+1234567890",
					0,
					"hashed-password",
					authType,
					null,
					"USER",
					false,
					true,
					now,
					now,
				);

				expect(user.authType).toBe(authType);
			});
		});

		it("should store all user roles", () => {
			const now = new Date();
			UserRoleValues.forEach((role) => {
				const user = new User(
					`user-${role}`,
					"Test User",
					"test@example.com",
					null,
					null,
					"+1234567890",
					0,
					"hashed-password",
					"LOCAL",
					null,
					role,
					false,
					true,
					now,
					now,
				);

				expect(user.role).toBe(role);
			});
		});

		it("should store user preferences with multiple skills", () => {
			const now = new Date();
			const skills = [
				{ skillId: "skill-1" },
				{ skillId: "skill-2" },
				{ skillId: "skill-3" },
			];
			const user = new User(
				"user-6",
				"Skilled User",
				"skilled@example.com",
				null,
				null,
				"+1234567890",
				0,
				"hashed-password",
				"LOCAL",
				null,
				"MENTOR",
				false,
				true,
				now,
				now,
				{
					interests: ["AI", "ML", "Python"],
					skills,
				},
			);

			expect(user.preferences?.skills).toHaveLength(3);
			expect(user.preferences?.skills[0].skillId).toBe("skill-1");
		});
	});
});
