import { describe, expect, it } from "vitest";
import { buildUserListQuery } from "../../../../../src/application/shared/utilities/user-list.util";

describe("user-list.util", () => {
	describe("buildUserListQuery", () => {
		it("should use the defaultRole when no role is provided", () => {
			const result = buildUserListQuery({
				defaultRole: "USER",
			});

			expect(result.query.role).toBe("USER");
		});

		it("should use the provided role over the defaultRole", () => {
			const result = buildUserListQuery({
				role: "MENTOR",
				defaultRole: "USER",
			});

			expect(result.query.role).toBe("MENTOR");
		});

		it("should handle role as an array", () => {
			const result = buildUserListQuery({
				role: ["USER", "MENTOR"],
				defaultRole: "USER",
			});

			expect(result.query.role).toEqual(["USER", "MENTOR"]);
		});

		it("should set isBlocked to true when status is 'blocked'", () => {
			const result = buildUserListQuery({
				status: "blocked",
				defaultRole: "USER",
			});

			expect(result.query.isBlocked).toBe(true);
		});

		it("should set isBlocked to false when status is 'active'", () => {
			const result = buildUserListQuery({
				status: "active",
				defaultRole: "USER",
			});

			expect(result.query.isBlocked).toBe(false);
		});

		it("should set isBlocked to undefined when no status is provided", () => {
			const result = buildUserListQuery({
				defaultRole: "USER",
			});

			expect(result.query.isBlocked).toBeUndefined();
		});

		it("should sort by createdAt descending by default (recent)", () => {
			const result = buildUserListQuery({
				defaultRole: "USER",
			});

			expect(result.sort).toEqual({ createdAt: -1 });
		});

		it("should sort by createdAt descending when sort is 'recent'", () => {
			const result = buildUserListQuery({
				sort: "recent",
				defaultRole: "USER",
			});

			expect(result.sort).toEqual({ createdAt: -1 });
		});

		it("should sort by createdAt ascending when sort is 'old'", () => {
			const result = buildUserListQuery({
				sort: "old",
				defaultRole: "USER",
			});

			expect(result.sort).toEqual({ createdAt: 1 });
		});

		it("should pass through the search term to the query", () => {
			const result = buildUserListQuery({
				search: "john",
				defaultRole: "USER",
			});

			expect(result.query.search).toBe("john");
		});

		it("should leave search undefined when not provided", () => {
			const result = buildUserListQuery({
				defaultRole: "USER",
			});

			expect(result.query.search).toBeUndefined();
		});

		it("should handle all parameters together", () => {
			const result = buildUserListQuery({
				search: "test",
				status: "blocked",
				sort: "old",
				role: "ADMIN",
				defaultRole: "USER",
			});

			expect(result).toEqual({
				query: {
					search: "test",
					role: "ADMIN",
					isBlocked: true,
				},
				sort: { createdAt: 1 },
			});
		});
	});
});
