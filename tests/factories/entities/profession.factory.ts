import { Profession } from "../../../src/domain/entities/profession.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createProfession(
	overrides: Partial<Profession> = {},
): Profession {
	const data = mergeDefaults<Profession>(
		{
			id: "profession-1",
			name: "Software Engineer",
			slug: "software-engineer",
			isActive: true,
		},
		overrides,
	);

	return new Profession(data.id, data.name, data.slug, data.isActive);
}
