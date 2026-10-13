import "server-only";
import prisma from "@/lib/prisma";
import { ConflictError } from "@/lib/errors";
import type { Actor } from "@/lib/session";
import { completePuzzle } from "@/features/pontos/internal";
import type { CompletePuzzleResult } from "@/features/pontos/types";
import { CHALLENGE_RATING, challengeSeed, nextChallengeChange } from "./domain/schedule";
import type { CompleteChallengeInput } from "./schemas";
import type { ChallengeDTO, ChallengeType } from "./types";

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

export async function getChallenge(_actor: Actor, type: ChallengeType): Promise<ChallengeDTO | null> {
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
  };
}

export async function completeChallenge(
  actor: Actor,
  input: CompleteChallengeInput,
): Promise<CompletePuzzleResult> {
  const current = await currentPuzzle(input.type, new Date());
  if (!current || current.id !== input.puzzleId) {
    throw new ConflictError("Este não é o desafio atual. Recarregue a página.");
  }
  return completePuzzle(actor.userId, input.puzzleId, input.type);
}
