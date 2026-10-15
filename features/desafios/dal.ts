import "server-only";
import prisma from "@/lib/prisma";
import { ConflictError } from "@/lib/errors";
import type { Actor } from "@/lib/session";
import { completePuzzle } from "@/features/pontos/internal";
import { CHALLENGE_RATING, challengeSeed, nextChallengeChange } from "./domain/schedule";
import type { ChallengeInput } from "./schemas";
import type { ChallengeDTO, ChallengeType, CompleteChallengeResult } from "./types";

async function currentPuzzle(type: ChallengeType, now: Date) {
  const where = { rating: CHALLENGE_RATING[type] };
  const count = await prisma.puzzle.count({ where });
  if (count === 0) return null;
  return prisma.puzzle.findFirst({
    where,
    orderBy: { externalId: "asc" },
    skip: challengeSeed(type, now) % count,
  });
}

async function assertCurrent(input: ChallengeInput) {
  const current = await currentPuzzle(input.type, new Date());
  if (!current || current.id !== input.puzzleId) {
    throw new ConflictError("Este não é o desafio atual. Recarregue a página.");
  }
}

async function isForfeited(userId: string, puzzleId: string, type: ChallengeType) {
  const forfeit = await prisma.puzzleForfeit.findUnique({
    where: { userId_puzzleId_type: { userId, puzzleId, type } },
  });
  return forfeit !== null;
}

export async function getChallenge(actor: Actor, type: ChallengeType): Promise<ChallengeDTO | null> {
  const now = new Date();
  const puzzle = await currentPuzzle(type, now);
  if (!puzzle) return null;
  return {
    id: puzzle.id,
    type,
    fen: puzzle.fen,
    moves: puzzle.moves.split(" "),
    rating: puzzle.rating,
    themes: puzzle.themes,
    nextChange: nextChallengeChange(type, now).toISOString(),
    forfeited: await isForfeited(actor.userId, puzzle.id, type),
  };
}

export async function forfeitChallenge(actor: Actor, input: ChallengeInput): Promise<void> {
  await assertCurrent(input);
  const completed = await prisma.puzzleCompletion.findUnique({
    where: { userId_puzzleId_type: { userId: actor.userId, puzzleId: input.puzzleId, type: input.type } },
  });
  if (completed) return;
  await prisma.puzzleForfeit.createMany({
    data: [{ userId: actor.userId, puzzleId: input.puzzleId, type: input.type }],
    skipDuplicates: true,
  });
}

export async function completeChallenge(
  actor: Actor,
  input: ChallengeInput,
): Promise<CompleteChallengeResult> {
  await assertCurrent(input);
  if (await isForfeited(actor.userId, input.puzzleId, input.type)) {
    return {
      success: false,
      message: "Puzzle resolvido, mas sem pontos: houve dica, reinício ou lance errado",
      forfeited: true,
    };
  }
  return completePuzzle(actor.userId, input.puzzleId, input.type);
}
