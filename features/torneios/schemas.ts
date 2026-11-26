import { z } from "zod";

export const acceptConviteSchema = z.object({
  torneioId: z.uuid("ID do torneio inválido"),
});
