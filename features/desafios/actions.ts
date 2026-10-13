"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/session";
import { toActionError, toFieldErrors, type ActionResult } from "@/lib/actions";
import { completeChallenge } from "./dal";
import { completeChallengeSchema, type CompleteChallengeInput } from "./schemas";

export async function completeChallengeAction(input: CompleteChallengeInput): Promise<ActionResult> {
  const actor = await requireActor();
  const parsed = completeChallengeSchema.safeParse(input);
  if (!parsed.success) return toFieldErrors(parsed.error);
  try {
    const result = await completeChallenge(actor, parsed.data);
    if (!result.success) return { ok: false, error: `❌ ${result.message}` };
    revalidatePath("/profile");
    revalidatePath("/ranking");
    return { ok: true, message: `🎉 Parabéns! +${result.points} pontos!` };
  } catch (error) {
    return toActionError(error);
  }
}
