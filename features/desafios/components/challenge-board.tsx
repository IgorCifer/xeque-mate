"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChessPuzzle } from "@react-chess-tools/react-chess-puzzle";
import { FlagIcon, HelpCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeChallengeAction, forfeitChallengeAction } from "../actions";
import type { ChallengeDTO } from "../types";

type ChallengeBoardProps = {
  challenge: ChallengeDTO;
  title: string;
  showCountdown?: boolean;
};

function formatRemaining(ms: number) {
  if (ms <= 0) return "Atualiza em instantes";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function ChallengeBoard({ challenge, title, showCountdown = false }: ChallengeBoardProps) {
  const puzzle = {
    fen: challenge.fen,
    moves: challenge.moves,
    makeFirstMove: true,
  };

  const [remaining, setRemaining] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isEligibleForPoints, setIsEligibleForPoints] = useState(!challenge.forfeited);
  const [pending, startTransition] = useTransition();
  const forfeitSent = useRef(challenge.forfeited);

  useEffect(() => {
    if (!showCountdown) return;

    const target = new Date(challenge.nextChange).getTime();
    const update = () => setRemaining(formatRemaining(target - Date.now()));

    update();
    const id = setInterval(update, 60_000);

    return () => clearInterval(id);
  }, [showCountdown, challenge.nextChange]);

  const showMessage = (text: string, ms: number) => {
    setMessage(text);
    setTimeout(() => setMessage(null), ms);
  };

  const markAsIneligible = (reason: string) => {
    if (forfeitSent.current) return;
    forfeitSent.current = true;
    setIsEligibleForPoints(false);
    forfeitChallengeAction({ puzzleId: challenge.id, type: challenge.type }).catch(() => {});
    showMessage(`⚠️ ${reason} - você não receberá pontos neste desafio`, 3000);
  };

  const handlePuzzleSolved = () => {
    if (pending) return;

    if (!isEligibleForPoints) {
      showMessage("✅ Puzzle resolvido! (sem pontos)", 5000);
      return;
    }

    forfeitSent.current = true;
    startTransition(async () => {
      try {
        const result = await completeChallengeAction({
          puzzleId: challenge.id,
          type: challenge.type,
        });
        const text = result.ok ? result.message : result.error;
        showMessage(text ?? "Puzzle resolvido!", 5000);
      } catch {
        showMessage("⚠️ Erro ao registrar conclusão", 5000);
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-white/20 backdrop-blur-md rounded-3xl p-5 border border-white/30">
      <h1 className="text-2xl font-bold text-white text-center mb-1">{title}</h1>

      <p className="text-xs text-blue-200 text-center">
        Rating: {challenge.rating} • Tema: {challenge.themes}
      </p>

      {remaining && (
        <p className="text-[11px] text-blue-100 text-center mb-3">
          Próximo desafio em: {remaining}
        </p>
      )}

      {!isEligibleForPoints && (
        <p className="text-[11px] text-blue-100 text-center mb-3">
          Sem pontos neste desafio: houve dica, reinício ou lance errado
        </p>
      )}

      {message && (
        <div
          role="status"
          className="mb-3 p-3 rounded-lg bg-red-500/20 border border-red-400/40 text-center"
        >
          <p className="text-sm font-semibold text-white">{message}</p>
        </div>
      )}

      <ChessPuzzle.Root
        puzzle={puzzle}
        onSolve={handlePuzzleSolved}
        onFail={() => markAsIneligible("Lance errado")}
        solveOnCheckmate
      >
        <ChessPuzzle.Board />

        <div className="flex items-center justify-center gap-10 mt-6">
          <div className="flex flex-col items-center gap-1">
            <ChessPuzzle.Reset
              asChild
              showOn={["not-started", "in-progress", "solved", "failed"]}
              onReset={() => markAsIneligible("Puzzle resetado")}
            >
              <Button
                variant="outline"
                size="icon"
                aria-label="Reiniciar"
                className="rounded-full bg-white/10 border-white/40 text-white hover:bg-white/20"
              >
                <FlagIcon className="w-5 h-5" />
              </Button>
            </ChessPuzzle.Reset>
            <span className="text-xs font-semibold text-white">Reiniciar</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <ChessPuzzle.Hint showOn={["in-progress"]} asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Dica"
                className="rounded-full bg-white/10 border-white/40 text-white hover:bg-white/20"
                onClick={() => markAsIneligible("Dica usada")}
              >
                <HelpCircleIcon className="w-5 h-5" />
              </Button>
            </ChessPuzzle.Hint>
            <span className="text-xs font-semibold text-white">Dica</span>
          </div>
        </div>
      </ChessPuzzle.Root>
    </div>
  );
}
