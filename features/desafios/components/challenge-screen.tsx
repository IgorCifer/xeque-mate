import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDateBR } from "../domain/schedule";
import type { ChallengeDTO } from "../types";
import { ChallengeBoard } from "./challenge-board";

type ChallengeScreenProps = {
  challenge: ChallengeDTO | null;
  title: string;
};

export function ChallengeScreen({ challenge, title }: ChallengeScreenProps) {
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
        {!challenge ? (
          <p className="text-white text-center mt-10">
            Ainda não há puzzles carregados no sistema.
          </p>
        ) : (
          <>
            <ChallengeBoard
              challenge={challenge}
              title={title}
              showCountdown={challenge.type === "weekly"}
            />
            {challenge.type === "daily" && (
              <p className="text-[11px] text-blue-100 text-center mt-2">
                Disponível até {formatDateBR(new Date(challenge.nextChange))}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
