import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { getDailyPuzzle } from "@/app/data/get-challenge-puzzle";
import { WeeklyPuzzleClient } from "../weekly-challenge/WeeklyPuzzleClient";
import { getDailyEndDate, formatDateBR } from "../utils/dates";

async function getDailyPuzzleAuto() {
  const puzzle = await getDailyPuzzle();
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