import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWeeklyPuzzle } from "@/app/data/get-challenge-puzzle";
import { WeeklyPuzzleClient } from "./WeeklyPuzzleClient";
import { requireSession } from "@/lib/session";

async function getWeeklyPuzzleAuto() {
  const puzzle = await getWeeklyPuzzle();
  if (!puzzle) return null;

  const today = new Date();
  const nextWeek = new Date(today);
  const day = today.getDay();
  const daysUntilNextWeek = (7 - day) % 7 || 7;
  nextWeek.setDate(today.getDate() + daysUntilNextWeek);
  nextWeek.setHours(0, 0, 0, 0);

  return {
    id: puzzle.id,
    fen: puzzle.fen,
    moves: puzzle.moves.split(" "),
    rating: puzzle.rating,
    themes: puzzle.themes,
    nextChange: nextWeek.toISOString(),
  };
}

export default async function WeeklyChallengePage() {
  await requireSession();
  const puzzle = await getWeeklyPuzzleAuto();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex items-center gap-3">
        <Link
          href="/practice"
          className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
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
            puzzleId={puzzle.id}
            type="weekly"
          />
        )}
      </main>
    </div>
  );
}
