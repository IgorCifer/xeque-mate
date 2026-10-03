import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(50, "O nome deve ter no máximo 50 caracteres."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
