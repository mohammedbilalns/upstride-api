import { MentorList } from "../../../src/domain/entities/mentor-list.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createMentorList(
	overrides: Partial<MentorList> = {},
): MentorList {
	const data = mergeDefaults<MentorList>(
		{
			id: "mentor-list-1",
			userId: "user-1",
			name: "Favorites",
			description: "Favorite mentors",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		overrides,
	);

	return new MentorList(
		data.id,
		data.userId,
		data.name,
		data.description,
		data.createdAt,
		data.updatedAt,
	);
}
