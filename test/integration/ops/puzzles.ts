import { POST as completePuzzleRoute } from "@/app/api/puzzles/complete/route";
import prisma from "@/lib/prisma";
import { callRoute } from "../http";
import type { TestUser } from "../users";

export async function resolverPuzzle(user: TestUser, puzzleId: string, type: "daily" | "weekly") {
  return callRoute(completePuzzleRoute, {
    method: "POST",
    path: "/api/puzzles/complete",
    user,
    body: { puzzleId, type },
  });
}

export async function seedPuzzle(externalId: string, rating: number) {
  return prisma.puzzle.create({
    data: {
      externalId,
      fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
      moves: "d1d8",
      rating,
      ratingDeviation: 75,
      popularity: 95,
      nbPlays: 5000,
      themes: "mateIn1",
    },
  });
}
