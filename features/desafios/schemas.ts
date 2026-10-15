import { z } from "zod";

export const challengeInputSchema = z.object({
  puzzleId: z.string().min(1, "puzzleId é obrigatório"),
  type: z.enum(["daily", "weekly"], "type deve ser 'daily' ou 'weekly'"),
});

export type ChallengeInput = z.infer<typeof challengeInputSchema>;
