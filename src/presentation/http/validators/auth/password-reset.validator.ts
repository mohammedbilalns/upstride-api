import z from "zod";

export const PasswordResetBodySchema = z.object({
	email: z.email().trim(),
});
