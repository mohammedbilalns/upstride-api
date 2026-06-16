import { z } from "zod";
import { nameSchema, objectIdSchema } from "../../../shared/validators";

export const MentorListIdParamSchema = z.object({
	listId: objectIdSchema,
});
export type MentorListIdParam = z.infer<typeof MentorListIdParamSchema>;

export const CreateMentorListBodySchema = z.object({
	name: nameSchema,
	description: z
		.string()
		.trim()
		.min(10, "Description must be at least 10 characters")
		.max(100, "Description must be at most 100 characters")
		.optional(),
});
export type CreateMentorListBody = z.infer<typeof CreateMentorListBodySchema>;

export const AddMentorToListBodySchema = z.object({
	mentorId: objectIdSchema,
});
export type AddMentorToListBody = z.infer<typeof AddMentorToListBodySchema>;

export const RemoveMentorFromListParamsSchema = z.object({
	listId: objectIdSchema,
	mentorId: objectIdSchema,
});

export type RemoveMentorFromListParams = z.infer<
	typeof RemoveMentorFromListParamsSchema
>;
