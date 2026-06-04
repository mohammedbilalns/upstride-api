import { z } from "zod";
import { passwordSchema } from "../../../../shared/validators";

export const UpdatePasswordBodySchema = z.object({
	email: z.email().trim(),
	newPassword: passwordSchema,
});
