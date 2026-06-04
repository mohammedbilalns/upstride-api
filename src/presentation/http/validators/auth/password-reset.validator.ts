import z from "zod";

export const PasswordResetBodySchema = z.object({
	email: z.email().trim(),
});

export type PasswordResetBody = z.infer<typeof PasswordResetBodySchema>;

const ResendPasswordResetBodySchema = z.object({
	email: z.email().trim(),
});

export type ResendPasswordResetBody = z.infer<
	typeof ResendPasswordResetBodySchema
>;
