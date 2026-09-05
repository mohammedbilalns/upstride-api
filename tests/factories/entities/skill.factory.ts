import { Skill } from "../../../src/domain/entities/skill.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createSkill(overrides: Partial<Skill> = {}): Skill {
	const data = mergeDefaults<Skill>(
		{
			id: "skill-1",
			name: "TypeScript",
			slug: "typescript",
			interestId: "interest-1",
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new Skill(
		data.id,
		data.name,
		data.slug,
		data.interestId,
		data.isActive,
		data.createdAt,
		data.updatedAt,
	);
}
