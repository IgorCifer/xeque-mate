import "server-only";
import { withTransaction, type Db } from "@/lib/prisma";
import { rankTournament } from "@/lib/tournament-ranking";
import { puzzlePrize, tournamentPrize } from "./domain/rules";
import type { CompletePuzzleResult, PuzzleType, TournamentAward } from "./types";

export async function awardTournamentPoints(
  torneioId: string,
  tx?: Db,
): Promise<TournamentAward[]> {
  return withTransaction(tx, async (db) => {
    const classificacao = rankTournament(
      await db.participante.findMany({ where: { torneioId } }),
      await db.partida.findMany({
        where: { torneioId },
        select: { whiteId: true, blackId: true, resultado: true },
      }),
    );

    const awards = classificacao.map((p) => ({
      userId: p.userId,
      position: p.posicao,
      ...tournamentPrize(p.posicao),
    }));

    for (const { userId, points, reason } of awards) {
      await db.user.update({
        where: { id: userId },
        data: { points: { increment: points } },
      });
      await db.pointsHistory.create({
        data: { userId, points, reason, referenceId: torneioId },
      });
    }

    return awards.map(({ userId, position, points }) => ({ userId, position, points }));
  });
}

export async function completePuzzle(
  userId: string,
  puzzleId: string,
  type: PuzzleType,
  tx?: Db,
): Promise<CompletePuzzleResult> {
  return withTransaction(tx, async (db) => {
    const existing = await db.puzzleCompletion.findUnique({
      where: { userId_puzzleId_type: { userId, puzzleId, type } },
    });
    if (existing) {
      return {
        success: false,
        message: "Puzzle já completado anteriormente",
        alreadyCompleted: true,
      };
    }

    const { points, reason } = puzzlePrize(type);
    await db.puzzleCompletion.create({
      data: { userId, puzzleId, type, pointsAwarded: points },
    });
    await db.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
    });
    await db.pointsHistory.create({
      data: { userId, points, reason, referenceId: puzzleId },
    });

    return { success: true, message: `Parabéns! Você ganhou ${points} pontos!`, points };
  });
}
