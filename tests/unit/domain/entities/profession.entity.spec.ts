import { describe, expect, it } from "vitest";
import { Profession } from "../../../../src/domain/entities/profession.entity";

describe("Profession Entity", () => {
	describe("constructor", () => {
		it("should create a valid profession", () => {
			const profession = new Profession(
				"prof-1",
				"Software Engineer",
				"software-engineer",
				true,
			);

			expect(profession.id).toBe("prof-1");
			expect(profession.name).toBe("Software Engineer");
			expect(profession.slug).toBe("software-engineer");
			expect(profession.isActive).toBe(true);
		});

		it("should create inactive profession", () => {
			const profession = new Profession(
				"prof-2",
				"Obsolete Role",
				"obsolete-role",
				false,
			);

			expect(profession.isActive).toBe(false);
		});

		it("should store profession metadata", () => {
			const professions = [
				{ name: "Product Manager", slug: "product-manager" },
				{ name: "Data Scientist", slug: "data-scientist" },
				{ name: "DevOps Engineer", slug: "devops-engineer" },
				{ name: "UX Designer", slug: "ux-designer" },
			];

			professions.forEach((prof, idx) => {
				const profession = new Profession(
					`prof-${idx}`,
					prof.name,
					prof.slug,
					true,
				);

				expect(profession.name).toBe(prof.name);
				expect(profession.slug).toBe(prof.slug);
				expect(profession.isActive).toBe(true);
			});
		});
	});
});
