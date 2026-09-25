import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { PrismaClient } from "@/app/generated/prisma2/client";
import { WeeklyPuzzleClient } from "./WeeklyPuzzleClient";

const prisma = new PrismaClient();

function getWeekOfYear(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor(
    (date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

async function getWeeklyPuzzleAuto() {
  const today = new Date();
  const week = getWeekOfYear(today);
  const year = today.getFullYear();

  const where = {
    rating: { gte: 1700, lte: 2000 },
  };

  const count = await prisma.puzzle.count({ where });
  if (count === 0) return null;

  const index = (year * 100 + week) % count;

  const puzzle = await prisma.puzzle.findFirst({
    where,
    orderBy: { externalId: "asc" },
    skip: index,
    take: 1,
  });

  if (!puzzle) return null;

  // próxima mudança de semana — aqui simplificado como próximo domingo 00:00
  const nextWeek = new Date(today);
  const day = today.getDay(); // 0..6
  const daysUntilNextWeek = (7 - day) % 7 || 7;
  nextWeek.setDate(today.getDate() + daysUntilNextWeek);
  nextWeek.setHours(0, 0, 0, 0);

  return {
    id: puzzle.id, // NOVO: retorna o ID
    fen: puzzle.fen,
    moves: puzzle.moves.split(" "),
    rating: puzzle.rating,
    themes: puzzle.themes,
    nextChange: nextWeek.toISOString(),
  };
}

export default async function WeeklyChallengePage() {
  const puzzle = await getWeeklyPuzzleAuto();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex items-center gap-3">
        <Link
          href="/practice"
          className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors"
        >
          <IoArrowBack className="w-6 h-6" />
          <span className="text-lg font-semibold">voltar</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center pt-4 px-4 pb-24">
        {!puzzle ? (
          <p className="text-white text-center mt-10">
            Ainda não há puzzles carregados no sistema.
          </p>
        ) : (
          <WeeklyPuzzleClient
            title="Desafio Semanal"
            fen={puzzle.fen}
            moves={puzzle.moves}
            rating={puzzle.rating}
            themes={puzzle.themes}
            nextChange={puzzle.nextChange}
            puzzleId={puzzle.id} // NOVO
            type="weekly" // NOVO
          />
        )}
      </main>
    </div>
  );
}
