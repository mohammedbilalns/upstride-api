import { SavedMentor } from "../../../src/domain/entities/saved-mentor.entity";
import { mergeDefaults } from "../utilities/merge-defaults";

export function createSavedMentor(
	overrides: Partial<SavedMentor> = {},
): SavedMentor {
	const data = mergeDefaults<SavedMentor>(
		{
			id: "saved-mentor-1",
			userId: "user-1",
			mentorId: "mentor-1",
			listId: "mentor-list-1",
			createdAt: new Date(),
		},
		overrides,
	);

	return new SavedMentor(
		data.id,
		data.userId,
		data.mentorId,
		data.listId,
		data.createdAt,
	);
}
