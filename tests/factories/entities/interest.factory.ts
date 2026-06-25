import { Interest } from "../../../src/domain/entities/interest.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createInterest(overrides: Partial<Interest> = {}): Interest {
	const data = mergeDefaults<Interest>(
		{
			id: "interest-1",
			name: "Backend Development",
			slug: "backend-development",
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new Interest(
		data.id,
		data.name,
		data.slug,
		data.isActive,
		data.createdAt,
		data.updatedAt,
	);
}
