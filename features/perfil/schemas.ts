import { z } from "zod";
import { AVATAR_MAX_BYTES } from "./domain/avatar";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(50, "O nome deve ter no máximo 50 caracteres."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateAvatarSchema = z.object({
  avatar: z
    .instanceof(File, { message: "Escolha uma imagem." })
    .refine((file) => file.size > 0, "Escolha uma imagem.")
    .refine((file) => file.size <= AVATAR_MAX_BYTES, "A imagem deve ter no máximo 300 KB."),
});
