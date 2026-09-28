import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma2/client";
import { rankTournament } from "@/lib/tournament-ranking";

export const POINTS_CONFIG = {
  TOURNAMENT_1ST: 100,
  TOURNAMENT_2ND: 60,
  TOURNAMENT_3RD: 30,
  TOURNAMENT_OTHER: 10,
  DAILY_PUZZLE: 15,
  WEEKLY_PUZZLE: 50,
} as const;

export type PointsReason =
  | "tournament_1st"
  | "tournament_2nd"
  | "tournament_3rd"
  | "tournament_other"
  | "daily_puzzle"
  | "weekly_puzzle";

function tournamentPrize(posicao: number): { points: number; reason: PointsReason } {
  if (posicao === 1) return { points: POINTS_CONFIG.TOURNAMENT_1ST, reason: "tournament_1st" };
  if (posicao === 2) return { points: POINTS_CONFIG.TOURNAMENT_2ND, reason: "tournament_2nd" };
  if (posicao === 3) return { points: POINTS_CONFIG.TOURNAMENT_3RD, reason: "tournament_3rd" };
  return { points: POINTS_CONFIG.TOURNAMENT_OTHER, reason: "tournament_other" };
}

export async function awardTournamentPoints(
  tx: Prisma.TransactionClient,
  torneioId: string
) {
  try {
    const participantes = rankTournament(
      await tx.participante.findMany({ where: { torneioId } }),
      await tx.partida.findMany({
        where: { torneioId },
        select: { whiteId: true, blackId: true, resultado: true },
      })
    );

    if (participantes.length === 0) {
      console.log("Nenhum participante encontrado no torneio");
      return;
    }

    const awards = participantes.map((p) => ({
      userId: p.userId,
      position: p.posicao,
      ...tournamentPrize(p.posicao),
    }));

    for (const { userId, points, reason } of awards) {
      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: points } },
      });
      await tx.pointsHistory.create({
        data: { userId, points, reason, referenceId: torneioId },
      });
    }

    console.log(
      `Pontos distribuídos para ${participantes.length} participantes do torneio ${torneioId}`
    );

    return awards.map(({ userId, position, points }) => ({ userId, position, points }));
  } catch (error) {
    console.error("Erro ao distribuir pontos do torneio:", error);
    throw error;
  }
}

export async function completePuzzle(
  userId: string,
  puzzleId: string,
  type: "daily" | "weekly"
) {
  try {
    const existing = await prisma.puzzleCompletion.findUnique({
      where: {
        userId_puzzleId_type: {
          userId,
          puzzleId,
          type,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: "Puzzle já completado anteriormente",
        alreadyCompleted: true,
      };
    }

    const points =
      type === "daily"
        ? POINTS_CONFIG.DAILY_PUZZLE
        : POINTS_CONFIG.WEEKLY_PUZZLE;

    const reason: PointsReason =
      type === "daily" ? "daily_puzzle" : "weekly_puzzle";

    const [completion] = await prisma.$transaction([
      prisma.puzzleCompletion.create({
        data: {
          userId,
          puzzleId,
          type,
          pointsAwarded: points,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: points,
          },
        },
      }),
      prisma.pointsHistory.create({
        data: {
          userId,
          points,
          reason,
          referenceId: puzzleId,
        },
      }),
    ]);

    return {
      success: true,
      message: `Parabéns! Você ganhou ${points} pontos!`,
      points,
      completion,
    };
  } catch (error) {
    console.error("Erro ao completar puzzle:", error);
    throw error;
  }
}