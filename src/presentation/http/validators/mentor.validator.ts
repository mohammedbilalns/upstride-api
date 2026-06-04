import { z } from "zod";
import {
	MAX_MENTOR_AREAS_OF_EXPERTISE,
	MAX_MENTOR_EDUCATION_ITEMS,
	MAX_MENTOR_EXPERIENCE_ITEMS,
} from "../../../domain/entities/mentor.entity";
import { SkillLevelValues } from "../../../domain/entities/user.entity";
import { MentorLanguageCodes } from "../../../shared/constants";
import {
	buildObjectIdParamSchema,
	limitSchema,
	pageSchema,
} from "../../../shared/validators";

const SkillItemSchema = z.object({
	skillId: z.string().min(1),
	level: z.enum(SkillLevelValues),
});

const ExperienceItemSchema = z.object({
	company: z.string().min(1, "Company name is required"),
	role: z.string().min(1, "Role is required"),
	description: z.string().min(1, "Description is required"),
	from: z.coerce.date({ message: "Invalid from date" }),
	to: z.coerce.date({ message: "Invalid to date" }).nullable(),
});

const BuildExperienceSchema = () =>
	z
		.array(ExperienceItemSchema)
		.min(1, "At least one experience item is required")
		.max(
			MAX_MENTOR_EXPERIENCE_ITEMS,
			`Maximum of ${MAX_MENTOR_EXPERIENCE_ITEMS} experience items allowed`,
		)
		.superRefine((experience, ctx) => {
			const now = new Date();
			for (let i = 0; i < experience.length; i++) {
				const exp = experience[i];
				const fromDate = new Date(exp.from);
				if (fromDate > now) {
					ctx.issues.push({
						code: "custom",
						message: "From date cannot be in the future",
						path: [i, "from"],
						input: exp.from,
					});
				}
				if (exp.to) {
					const toDate = new Date(exp.to);
					if (toDate > now) {
						ctx.issues.push({
							code: "custom",
							message: "To date cannot be in the future",
							path: [i, "to"],
							input: exp.to,
						});
					}
					if (fromDate > toDate) {
						ctx.issues.push({
							code: "custom",
							message: "From date cannot be after To date",
							path: [i, "from"],
							input: exp.from,
						});
					}
				}
			}
		});

export const RegisterMentorSchema = z.object({
	bio: z.string().min(10, "Bio must be at least 10 characters long"),
	currentRoleId: z.string().min(1, "Current role is required"),
	organization: z.string().min(1, "Organization is required"),
	yearsOfExperience: z
		.number()
		.min(0, "Years of experience must be at least 0"),
	personalWebsite: z.url("Invalid website URL").or(z.literal("")).nullish(),
	resumeId: z.string().min(1, "Resume is required"),
	educationalQualifications: z
		.array(z.string().min(1))
		.min(1, "At least one qualification is required")
		.max(
			MAX_MENTOR_EDUCATION_ITEMS,
			`Maximum of ${MAX_MENTOR_EDUCATION_ITEMS} educational qualifications allowed`,
		),
	languages: z
		.array(z.enum(MentorLanguageCodes))
		.min(1, "At least one language is required"),
	areasOfExpertise: z
		.array(z.string().min(1))
		.min(1, "At least one area of expertise is required")
		.max(
			MAX_MENTOR_AREAS_OF_EXPERTISE,
			`Maximum of ${MAX_MENTOR_AREAS_OF_EXPERTISE} areas of expertise allowed`,
		),
	toolsAndSkills: z
		.array(SkillItemSchema)
		.min(1, "At least one skill is required"),
	experience: BuildExperienceSchema(),
});

export const ResubmitMentorSchema = z.object({
	bio: z.string().min(10, "Bio must be at least 10 characters long").optional(),
	currentRoleId: z.string().min(1, "Current role is required").optional(),
	organization: z.string().min(1, "Organization is required").optional(),
	yearsOfExperience: z
		.number()
		.min(0, "Years of experience must be at least 0")
		.optional(),
	personalWebsite: z.url("Invalid website URL").or(z.literal("")).nullish(),
	resumeId: z.string().min(1, "Resume is required").optional(),
	educationalQualifications: z
		.array(z.string().min(1))
		.min(1, "At least one qualification is required")
		.max(
			MAX_MENTOR_EDUCATION_ITEMS,
			`Maximum of ${MAX_MENTOR_EDUCATION_ITEMS} educational qualifications allowed`,
		)
		.optional(),
	languages: z.array(z.enum(MentorLanguageCodes)).min(1).optional(),
	areasOfExpertise: z
		.array(z.string().min(1))
		.min(1, "At least one area of expertise is required")
		.max(
			MAX_MENTOR_AREAS_OF_EXPERTISE,
			`Maximum of ${MAX_MENTOR_AREAS_OF_EXPERTISE} areas of expertise allowed`,
		)
		.optional(),
	toolsAndSkills: z
		.array(SkillItemSchema)
		.min(1, "At least one skill is required")
		.optional(),
	experience: BuildExperienceSchema().optional(),
});

export const MentorApplicationsQuerySchema = z.object({
	page: pageSchema,
	limit: limitSchema,
	status: z.enum(["approved", "rejected", "pending"]).optional(),
	sort: z.enum(["recent", "old", "status"]).optional().default("recent"),
});

export type MentorApplicationsQuery = z.infer<
	typeof MentorApplicationsQuerySchema
>;

const MentorDiscoveryQueryShape = z
	.object({
		page: pageSchema,
		search: z.string().trim().min(1).optional(),
		category: z.string().trim().min(1).optional(),
		languages: z
			.union([
				z.enum(MentorLanguageCodes),
				z.array(z.enum(MentorLanguageCodes)),
			])
			.optional()
			.transform((value) => {
				if (!value) return undefined;
				return Array.isArray(value) ? value : [value];
			}),
		tierName: z.string().min(1).optional(),
		minExperience: z.coerce.number().int().min(0).optional(),
		maxExperience: z.coerce.number().int().min(0).optional(),
		sort: z.enum(["rating", "recent"]).optional(),
	})
	.refine(
		(input) =>
			input.minExperience === undefined ||
			input.maxExperience === undefined ||
			input.minExperience <= input.maxExperience,
		{
			message: "minExperience cannot be greater than maxExperience",
			path: ["minExperience"],
		},
	);

export const MentorDiscoveryQuerySchema = z.preprocess((value) => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return value;
	}

	const query = value as Record<string, unknown>;
	if (query.languages !== undefined || query["languages[]"] === undefined) {
		return query;
	}

	return {
		...query,
		languages: query["languages[]"],
	};
}, MentorDiscoveryQueryShape);

export type MentorDiscoveryQuery = z.infer<typeof MentorDiscoveryQuerySchema>;

export const MentorIdParamSchema = buildObjectIdParamSchema("id");

export type MentorIdParam = z.infer<typeof MentorIdParamSchema>;

export const RejectMentorBodySchema = z.object({
	reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
});

export type RejectMentorBody = z.infer<typeof RejectMentorBodySchema>;

export const UpdateMentorProfileBodySchema = z.object({
	currentRoleId: z.string().trim().min(1).optional(),
	organization: z.string().trim().min(1).optional(),
	areasOfExpertise: z
		.array(z.string().trim().min(1))
		.min(1, "Select at least one area of interest")
		.max(
			MAX_MENTOR_AREAS_OF_EXPERTISE,
			`Maximum of ${MAX_MENTOR_AREAS_OF_EXPERTISE} areas of interest allowed`,
		)
		.optional(),
	languages: z
		.array(z.enum(MentorLanguageCodes))
		.min(1, "Select at least one language")
		.optional(),
	currentPricePer30Min: z.number().int().min(100).max(10000).optional(),
	bio: z.string().trim().min(10).optional(),
	educationalQualifications: z
		.array(z.string().trim().min(1))
		.min(1, "At least one educational qualification is required")
		.max(
			MAX_MENTOR_EDUCATION_ITEMS,
			`Maximum of ${MAX_MENTOR_EDUCATION_ITEMS} educational qualifications allowed`,
		)
		.optional(),
	addSkills: z.array(SkillItemSchema).optional(),
	removeSkills: z.array(z.string().min(1)).optional(),
	addEducationalQualifications: z.array(z.string().min(1)).optional(),
});

export type UpdateMentorProfileBody = z.infer<
	typeof UpdateMentorProfileBodySchema
>;
