"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/session";
import { toActionError, toFieldErrors, type ActionResult } from "@/lib/actions";
import { completeChallenge, forfeitChallenge } from "./dal";
import { challengeInputSchema, type ChallengeInput } from "./schemas";

export async function completeChallengeAction(input: ChallengeInput): Promise<ActionResult> {
  const actor = await requireActor();
  const parsed = challengeInputSchema.safeParse(input);
  if (!parsed.success) return toFieldErrors(parsed.error);
  try {
    const result = await completeChallenge(actor, parsed.data);
    if (!result.success) {
      if ("forfeited" in result) return { ok: true, message: "✅ Puzzle resolvido! (sem pontos)" };
      return { ok: false, error: `❌ ${result.message}` };
    }
    revalidatePath("/profile");
    revalidatePath("/ranking");
    return { ok: true, message: `🎉 Parabéns! +${result.points} pontos!` };
  } catch (error) {
    return toActionError(error);
  }
}

export async function forfeitChallengeAction(input: ChallengeInput): Promise<ActionResult> {
  const actor = await requireActor();
  const parsed = challengeInputSchema.safeParse(input);
  if (!parsed.success) return toFieldErrors(parsed.error);
  try {
    await forfeitChallenge(actor, parsed.data);
    return { ok: true };
  } catch (error) {
    return toActionError(error);
  }
}
