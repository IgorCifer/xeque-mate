import prisma from "@/lib/prisma";
import type { Puzzle } from "@/app/generated/prisma2/client";

// Faixas de rating de cada desafio (a importação de puzzles cobre 1200–2000).
const DAILY_RATING = { gte: 1200, lte: 1699 };
const WEEKLY_RATING = { gte: 1700, lte: 2000 };

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

function getWeekOfYear(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor(
    (date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

/**
 * Escolhe um puzzle da faixa de rating de forma determinística:
 * ordena por externalId e pega o índice `seed % total`.
 */
async function pickPuzzle(
  rating: { gte: number; lte: number },
  seed: number
): Promise<Puzzle | null> {
  const where = { rating };

  const count = await prisma.puzzle.count({ where });
  if (count === 0) return null;

  return prisma.puzzle.findFirst({
    where,
    orderBy: { externalId: "asc" },
    skip: seed % count,
    take: 1,
  });
}

/** Puzzle do desafio diário de hoje (muda à meia-noite). */
export async function getDailyPuzzle() {
  const today = new Date();
  return pickPuzzle(DAILY_RATING, today.getFullYear() * 1000 + getDayOfYear(today));
}

/** Puzzle do desafio semanal desta semana (muda no domingo à meia-noite). */
export async function getWeeklyPuzzle() {
  const today = new Date();
  return pickPuzzle(WEEKLY_RATING, today.getFullYear() * 100 + getWeekOfYear(today));
}
