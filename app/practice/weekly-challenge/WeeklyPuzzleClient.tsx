"use client";

import { useEffect, useState, useRef } from "react";
import { ChessPuzzle } from "@react-chess-tools/react-chess-puzzle";
import { Button } from "@/components/ui/button";
import { FlagIcon, HelpCircleIcon } from "lucide-react";

type WeeklyPuzzleClientProps = {
  fen: string;
  moves: string[];
  rating: number;
  themes: string;
  title?: string;
  nextChange?: string;
  puzzleId: string;
  type: "daily" | "weekly";
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

export function WeeklyPuzzleClient({
  fen,
  moves,
  rating,
  themes,
  title = "Desafio Semanal",
  nextChange,
  puzzleId,
  type,
}: WeeklyPuzzleClientProps) {
  const puzzle = {
    fen,
    moves,
    makeFirstMove: true,
  };

  const [remaining, setRemaining] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Rastreia se o usuário está elegível para ganhar pontos
  const [isEligibleForPoints, setIsEligibleForPoints] = useState(true);
  
  // Ref para rastrear se já mostrou aviso
  const hasShownWarning = useRef(false);

  useEffect(() => {
    if (!nextChange) return;

    const target = new Date(nextChange).getTime();

    const update = () => {
      const now = Date.now();
      setRemaining(formatRemaining(target - now));
    };

    update();
    const id = setInterval(update, 60_000);

    return () => clearInterval(id);
  }, [nextChange]);

  // Função para marcar como inelegível (será chamada pelos botões)
  const markAsIneligible = (reason: string) => {
    if (!hasShownWarning.current) {
      console.log(`Elegibilidade perdida: ${reason}`);
      setIsEligibleForPoints(false);
      setMessage(`⚠️ ${reason} - você não receberá pontos neste desafio`);
      setTimeout(() => setMessage(null), 3000);
      hasShownWarning.current = true;
    } else {
      setIsEligibleForPoints(false);
    }
  };

  // Função para registrar conclusão do puzzle
  const handlePuzzleSolved = async () => {
    if (isSubmitting) return;

    // Verifica elegibilidade antes de registrar
    if (!isEligibleForPoints) {
      setMessage("✅ Puzzle resolvido! (sem pontos)");
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/puzzles/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          puzzleId,
          type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`🎉 Parabéns! +${data.points} pontos!`);
      } else if (data.alreadyCompleted) {
        setMessage("❌ Puzzle já completado anteriormente");
      } else {
        setMessage(data.message || "Puzzle resolvido!");
      }

      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error("Erro ao registrar conclusão:", error);
      setMessage("⚠️ Erro ao registrar conclusão");
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/20 backdrop-blur-md rounded-3xl p-5 border border-white/30">
      <h1 className="text-2xl font-bold text-white text-center mb-1">
        {title}
      </h1>

      <p className="text-xs text-blue-200 text-center">
        Rating: {rating} • Tema: {themes}
      </p>

      {remaining && (
        <p className="text-[11px] text-blue-100 text-center mb-3">
          Próximo desafio em: {remaining}
        </p>
      )}

      {/* Mensagem de feedback */}
      {message && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/20 border border-red-400/40 text-center">
          <p className="text-sm font-semibold text-white">{message}</p>
        </div>
      )}

      <ChessPuzzle.Root 
        puzzle={puzzle} 
        onSolve={handlePuzzleSolved}
      >
        <ChessPuzzle.Board />

        <div className="flex items-center justify-center gap-10 mt-6">
          {/* Reiniciar */}
          <div className="flex flex-col items-center gap-1">
            <ChessPuzzle.Reset
              asChild
              showOn={["not-started", "in-progress", "solved", "failed"]}
            >
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/10 border-white/40 text-white hover:bg-white/20"
                onPointerDown={() => markAsIneligible("Puzzle resetado")}
              >
                <FlagIcon className="w-5 h-5" />
              </Button>
            </ChessPuzzle.Reset>
            <span className="text-xs font-semibold text-white">Reiniciar</span>
          </div>

          {/* Dica */}
          <div className="flex flex-col items-center gap-1">
            <ChessPuzzle.Hint 
              showOn={["in-progress"]} 
              asChild
            >
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/10 border-white/40 text-white hover:bg-white/20"
                onPointerDown={() => markAsIneligible("Dica usada")}
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
