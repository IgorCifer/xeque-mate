import type { ActionResult } from "@/lib/actions";
import type { UnlockedAchievement } from "@/features/conquistas/types";

export type ConviteDTO = {
  id: string;
  nome: string;
  data: Date;
};

export type AcceptConviteState = (ActionResult & { achievements?: UnlockedAchievement[] }) | null;
