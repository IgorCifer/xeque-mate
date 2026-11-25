"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs, type PieceHandlerArgs } from "react-chessboard";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-provider";
import { describeResult, gameResult } from "../domain/game-result";

const OPPONENT_DELAY_MS = 500;

function snapshot(game: Chess) {
  return {
    fen: game.fen(),
    turn: game.turn(),
    inCheck: game.inCheck(),
    moveCount: game.history().length,
    result: gameResult(game),
  };
}

function statusText(state: ReturnType<typeof snapshot>) {
  if (state.turn === "b") return "Vez das pretas…";
  return state.inCheck ? "Xeque! Sua vez" : "Sua vez (brancas)";
}

export function TrainingGame() {
  const confirm = useConfirm();
  const [game] = useState(() => new Chess());
  const [state, setState] = useState(() => snapshot(game));
  const opponentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (opponentTimer.current) clearTimeout(opponentTimer.current);
    };
  }, []);

  function playOpponentMove() {
    opponentTimer.current = null;
    if (game.isGameOver()) return;

    const moves = game.moves();
    game.move(moves[Math.floor(Math.random() * moves.length)]);
    setState(snapshot(game));
  }

  function canDragPiece({ piece }: PieceHandlerArgs) {
    return !game.isGameOver() && game.turn() === "w" && piece.pieceType.startsWith("w");
  }

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!targetSquare || game.turn() !== "w" || game.isGameOver()) return false;

    try {
      game.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    } catch {
      return false;
    }

    setState(snapshot(game));
    if (!game.isGameOver()) {
      opponentTimer.current = setTimeout(playOpponentMove, OPPONENT_DELAY_MS);
    }
    return true;
  }

  async function startNewGame() {
    if (!state.result) {
      const confirmed = await confirm({
        title: "Abandonar a partida?",
        description: "A partida atual ainda não terminou. Começar outra descarta os lances feitos.",
        confirmLabel: "Nova partida",
      });
      if (!confirmed) return;
    }

    if (opponentTimer.current) {
      clearTimeout(opponentTimer.current);
      opponentTimer.current = null;
    }
    game.reset();
    setState(snapshot(game));
  }

  const result = state.result ? describeResult(state.result) : null;

  return (
    <div className="flex flex-col">
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
        <div className="w-full max-w-md bg-white/20 backdrop-blur-md rounded-3xl p-5 border border-white/30">
          <h1 className="text-2xl font-bold text-white text-center mb-1">Jogo Treino</h1>

          <div role="status" aria-live="polite" className="mb-4">
            {result ? (
              <div className="mt-3 p-3 rounded-lg bg-white/20 border border-white/40 text-center">
                <p className="text-base font-bold text-white">{result.title}</p>
                <p className="text-xs text-blue-100 mt-1">{result.description}</p>
              </div>
            ) : (
              <p className="text-sm text-blue-200 text-center">{statusText(state)}</p>
            )}
          </div>

          <div className="rounded-lg overflow-hidden shadow-2xl">
            <Chessboard
              options={{
                id: "training-board",
                position: state.fen,
                onPieceDrop,
                canDragPiece,
              }}
            />
          </div>

          <Button
            type="button"
            size="lg"
            onClick={startNewGame}
            disabled={state.moveCount === 0}
            className="mt-6 h-12 w-full rounded-sm bg-brand-400 hover:bg-brand-600 hover:border-brand-900 transition text-white font-bold border-b-4 border-brand-500"
          >
            <RotateCcw className="w-4 h-4" />
            Nova partida
          </Button>
        </div>
      </main>
    </div>
  );
}
