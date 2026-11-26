"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/session";
import { toActionError, toFieldErrors } from "@/lib/actions";
import type { UnlockedAchievement } from "@/features/conquistas/types";
import { acceptConvite } from "./dal";
import { acceptConviteSchema } from "./schemas";
import type { AcceptConviteState } from "./types";

export async function acceptConviteAction(
  _prev: AcceptConviteState,
  formData: FormData,
): Promise<AcceptConviteState> {
  const actor = await requireActor();
  const parsed = acceptConviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  let achievements: UnlockedAchievement[];
  try {
    achievements = await acceptConvite(actor, parsed.data.torneioId);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/torneios");
  return { ok: true, message: "Você entrou no torneio!", achievements };
}
