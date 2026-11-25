import "server-only";
import prisma from "@/lib/prisma";
import { NotFoundError, RuleViolationError } from "@/lib/errors";
import type { Actor } from "@/lib/session";
import { AVATAR_MAX_BYTES, avatarUrl, detectImageType } from "./domain/avatar";
import type { UpdateProfileInput } from "./schemas";
import type { AvatarDTO, ProfileDTO } from "./types";

export async function getProfile(actor: Actor): Promise<ProfileDTO> {
  const user = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: { name: true, image: true },
  });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return { name: user.name, image: user.image };
}

export async function getPoints(actor: Actor): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: { points: true },
  });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return user.points;
}

export async function updateProfile(actor: Actor, input: UpdateProfileInput): Promise<{ name: string }> {
  const { count } = await prisma.user.updateMany({
    where: { id: actor.userId },
    data: { name: input.name },
  });
  if (count === 0) throw new NotFoundError("Usuário não encontrado");
  return { name: input.name };
}

export async function getAvatar(_actor: Actor, userId: string): Promise<AvatarDTO | null> {
  const avatar = await prisma.userAvatar.findUnique({
    where: { userId },
    select: { data: true, contentType: true },
  });
  return avatar ? { data: avatar.data, contentType: avatar.contentType } : null;
}

export async function updateAvatar(actor: Actor, data: Uint8Array<ArrayBuffer>): Promise<string> {
  if (data.byteLength > AVATAR_MAX_BYTES) {
    throw new RuleViolationError("A imagem deve ter no máximo 300 KB.");
  }
  const contentType = detectImageType(data);
  if (!contentType) {
    throw new RuleViolationError("Formato não suportado. Use uma imagem JPEG, PNG ou WebP.");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: actor.userId }, select: { id: true } });
    if (!user) throw new NotFoundError("Usuário não encontrado");

    const avatar = await tx.userAvatar.upsert({
      where: { userId: actor.userId },
      create: { userId: actor.userId, data, contentType },
      update: { data, contentType },
      select: { updatedAt: true },
    });
    const image = avatarUrl(actor.userId, avatar.updatedAt);
    await tx.user.update({ where: { id: actor.userId }, data: { image } });
    return image;
  });
}

export async function removeAvatar(actor: Actor): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: actor.userId },
      data: { image: null },
    });
    if (count === 0) throw new NotFoundError("Usuário não encontrado");
    await tx.userAvatar.deleteMany({ where: { userId: actor.userId } });
  });
}
