"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/session";
import { toActionError, toFieldErrors, type ActionState } from "@/lib/actions";
import { updateAvatarSchema, updateProfileSchema } from "./schemas";
import { removeAvatar, updateAvatar, updateProfile } from "./dal";

function revalidateProfile() {
  revalidatePath("/profile");
  revalidatePath("/userSettings/change-profile");
}

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

export async function updateAvatarAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = updateAvatarSchema.safeParse({ avatar: formData.get("avatar") });
  if (!parsed.success) return toFieldErrors(parsed.error);
  try {
    await updateAvatar(actor, new Uint8Array(await parsed.data.avatar.arrayBuffer()));
  } catch (error) {
    return toActionError(error);
  }
  revalidateProfile();
  return { ok: true, message: "Foto atualizada." };
}

export async function removeAvatarAction(): Promise<ActionState> {
  const actor = await requireActor();
  try {
    await removeAvatar(actor);
  } catch (error) {
    return toActionError(error);
  }
  revalidateProfile();
  return { ok: true, message: "Foto removida." };
}
