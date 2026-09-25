import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { PrismaClient } from "@/app/generated/prisma2/client";
import { WeeklyPuzzleClient } from "../weekly-challenge/WeeklyPuzzleClient";
import { getDailyEndDate, formatDateBR } from "../utils/dates";

const prisma = new PrismaClient();

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

async function getDailyPuzzleAuto() {
  const today = new Date();
  const day = getDayOfYear(today);
  const year = today.getFullYear();

  const where = {
    rating: { gte: 1200, lte: 1699 },
  };

  const count = await prisma.puzzle.count({ where });
  if (count === 0) return null;

  const index = (year * 1000 + day) % count;

  const puzzle = await prisma.puzzle.findFirst({
    where,
    orderBy: { externalId: "asc" },
    skip: index,
    take: 1,
  });

  if (!puzzle) return null;

  const endDate = getDailyEndDate();

  return {
    id: puzzle.id, // NOVO: retorna o ID
    fen: puzzle.fen,
    moves: puzzle.moves.split(" "),
    rating: puzzle.rating,
    themes: puzzle.themes,
    availableUntil: formatDateBR(endDate),
  };
}

export default async function DailyChallengePage() {
  const puzzle = await getDailyPuzzleAuto();

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
          <>
            <WeeklyPuzzleClient
              title="Desafio Diário"
              fen={puzzle.fen}
              moves={puzzle.moves}
              rating={puzzle.rating}
              themes={puzzle.themes}
              puzzleId={puzzle.id} // NOVO
              type="daily" // NOVO
            />
            <p className="text-[11px] text-blue-100 text-center mt-2">
              Disponível até {puzzle.availableUntil}
            </p>
          </>
        )}
      </main>
    </div>
  );
}