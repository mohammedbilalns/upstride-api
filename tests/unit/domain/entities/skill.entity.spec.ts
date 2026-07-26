import { describe, expect, it } from "vitest";
import { Skill } from "../../../../src/domain/entities/skill.entity";

describe("Skill Entity", () => {
	describe("constructor", () => {
		it("should create a valid skill", () => {
			const now = new Date();
			const skill = new Skill(
				"skill-1",
				"React",
				"react",
				"interest-1",
				true,
				now,
				now,
			);

			expect(skill.id).toBe("skill-1");
			expect(skill.name).toBe("React");
			expect(skill.slug).toBe("react");
			expect(skill.interestId).toBe("interest-1");
			expect(skill.isActive).toBe(true);
			expect(skill.createdAt).toEqual(now);
			expect(skill.updatedAt).toEqual(now);
		});

		it("should create inactive skill", () => {
			const skill = new Skill(
				"skill-2",
				"Deprecated Tech",
				"deprecated-tech",
				"interest-1",
				false,
			);

			expect(skill.isActive).toBe(false);
		});

		it("should handle optional timestamps", () => {
			const skill = new Skill(
				"skill-3",
				"Python",
				"python",
				"interest-2",
				true,
			);

			expect(skill.createdAt).toBeUndefined();
			expect(skill.updatedAt).toBeUndefined();
		});

		it("should store skill metadata correctly", () => {
			const now = new Date();
			const skill = new Skill(
				"skill-4",
				"TypeScript",
				"typescript",
				"interest-3",
				true,
				now,
				now,
			);

			expect(skill.name).toBe("TypeScript");
			expect(skill.slug).toBe("typescript");
			expect(skill.interestId).toBe("interest-3");
		});
	});
});
