import "server-only";
import prisma from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import type { Actor } from "@/lib/session";
import type { UpdateProfileInput } from "./schemas";
import type { ProfileDTO } from "./types";

export async function getProfile(actor: Actor): Promise<ProfileDTO> {
  const user = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: { name: true },
  });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return { name: user.name };
}

export async function updateProfile(actor: Actor, input: UpdateProfileInput): Promise<ProfileDTO> {
  const { count } = await prisma.user.updateMany({
    where: { id: actor.userId },
    data: { name: input.name },
  });
  if (count === 0) throw new NotFoundError("Usuário não encontrado");
  return { name: input.name };
}
