import { describe, expect, it } from "vitest";
import { Interest } from "../../../../src/domain/entities/interest.entity";

describe("Interest Entity", () => {
	describe("constructor", () => {
		it("should create a valid interest", () => {
			const now = new Date();
			const interest = new Interest(
				"interest-1",
				"Software Development",
				"software-development",
				true,
				now,
				now,
			);

			expect(interest.id).toBe("interest-1");
			expect(interest.name).toBe("Software Development");
			expect(interest.slug).toBe("software-development");
			expect(interest.isActive).toBe(true);
			expect(interest.createdAt).toEqual(now);
			expect(interest.updatedAt).toEqual(now);
		});

		it("should create inactive interest", () => {
			const now = new Date();
			const interest = new Interest(
				"interest-2",
				"Obsolete Field",
				"obsolete-field",
				false,
				now,
				now,
			);

			expect(interest.isActive).toBe(false);
		});

		it("should store interest metadata", () => {
			const now = new Date();
			const interest = new Interest(
				"interest-3",
				"Machine Learning",
				"machine-learning",
				true,
				now,
				now,
			);

			expect(interest.name).toBe("Machine Learning");
			expect(interest.slug).toBe("machine-learning");
		});

		it("should handle various interest types", () => {
			const now = new Date();
			const interests = [
				{ name: "AI & Machine Learning", slug: "ai-machine-learning" },
				{ name: "Web Development", slug: "web-development" },
				{ name: "Data Science", slug: "data-science" },
				{ name: "DevOps", slug: "devops" },
			];

			interests.forEach((int, idx) => {
				const interest = new Interest(
					`interest-${idx}`,
					int.name,
					int.slug,
					true,
					now,
					now,
				);

				expect(interest.name).toBe(int.name);
				expect(interest.slug).toBe(int.slug);
				expect(interest.isActive).toBe(true);
			});
		});
	});
});
