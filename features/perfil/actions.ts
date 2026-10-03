"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/session";
import { toActionError, toFieldErrors, type ActionState } from "@/lib/actions";
import { updateProfileSchema } from "./schemas";
import { updateProfile } from "./dal";

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  try {
    await updateProfile(actor, parsed.data);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/profile");
  return { ok: true, message: "Perfil atualizado." };
}
