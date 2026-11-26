import "server-only";
import prisma from "@/lib/prisma";
import { ConflictError, NotFoundError, RuleViolationError } from "@/lib/errors";
import type { Actor } from "@/lib/session";
import { recordTournamentJoined } from "@/features/conquistas/internal";
import type { UnlockedAchievement } from "@/features/conquistas/types";
import { LIMITE_TORNEIOS_PARTICIPANDO } from "./domain/limites";
import type { ConviteDTO } from "./types";

async function torneioAbertoAoConvite(torneioId: string) {
  const torneio = await prisma.torneio.findUnique({
    where: { id: torneioId },
    select: {
      id: true,
      nome: true,
      data: true,
      finalizado: true,
      _count: { select: { partidas: true } },
    },
  });
  if (!torneio) throw new NotFoundError("Torneio não encontrado");
  if (torneio.finalizado) throw new ConflictError("Torneio já finalizado");
  if (torneio._count.partidas > 0) throw new ConflictError("Confrontos já foram gerados");
  return torneio;
}

export async function getConvite(_actor: Actor, torneioId: string): Promise<ConviteDTO> {
  const torneio = await torneioAbertoAoConvite(torneioId);
  return { id: torneio.id, nome: torneio.nome, data: torneio.data };
}

export async function acceptConvite(actor: Actor, torneioId: string): Promise<UnlockedAchievement[]> {
  await torneioAbertoAoConvite(torneioId);
  const userId = actor.userId;

  const jaParticipa = await prisma.participante.findUnique({
    where: { torneioId_userId: { torneioId, userId } },
    select: { id: true },
  });
  if (jaParticipa) throw new ConflictError("Usuário já é participante");

  const participando = await prisma.participante.count({
    where: { userId, torneio: { finalizado: false, criadorId: { not: userId } } },
  });
  if (participando >= LIMITE_TORNEIOS_PARTICIPANDO) {
    throw new RuleViolationError(
      `Limite de ${LIMITE_TORNEIOS_PARTICIPANDO} torneios em andamento participando atingido`,
    );
  }

  const { count } = await prisma.participante.createMany({
    data: [{ torneioId, userId }],
    skipDuplicates: true,
  });
  if (count === 0) throw new ConflictError("Usuário já é participante");

  return recordTournamentJoined(userId);
}
