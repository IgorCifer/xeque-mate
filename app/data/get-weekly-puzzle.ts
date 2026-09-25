// app/data/get-weekly-puzzle.ts
import { PrismaClient } from "@/app/generated/prisma2/client";

const prisma = new PrismaClient();

export async function getWeeklyPuzzle() {
  // Por enquanto, só pega o primeiro puzzle da tabela.
  // Depois podemos filtrar por rating, temas ou marcar um "puzzle da semana".
  const puzzle = await prisma.puzzle.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!puzzle) return null;

  return {
    fen: puzzle.fen,
    moves: puzzle.moves.split(" "), // CSV do Lichess vira array de UCI
    // mais campos se precisar (rating, temas etc.)
    rating: puzzle.rating,
    themes: puzzle.themes,
  };
}
