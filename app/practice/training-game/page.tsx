"use client";

import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";

interface PieceDropHandlerArgs {
  sourceSquare: string;
  targetSquare: string | null;
}

export default function TrainingGamePage() {
  const [chessGame] = useState(() => new Chess());
  const [chessPosition, setChessPosition] = useState(() => chessGame.fen());

  function makeRandomMove() {
    const possibleMoves = chessGame.moves();

    if (chessGame.isGameOver()) {
      return;
    }

    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    chessGame.move(randomMove);
    setChessPosition(chessGame.fen());
  }

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!targetSquare) {
      return false;
    }

    try {
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      setChessPosition(chessGame.fen());
      setTimeout(makeRandomMove, 500);
      return true;
    } catch {
      return false;
    }
  }

  const chessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    id: "training-board",
  };

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

      <main className="flex-1 flex flex-col items-center pt-32 pb-38 px-4">
        <div className="w-full max-w-2xl">
          <div className="bg-linear-to-br backdrop-blur-md bg-white/20 rounded-3xl shadow-2xl p-6 border border-white/30">
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Jogo Treino
            </h1>
            <p className="text-blue-200 text-center mb-6 text-sm">
              Brancas Jogam
            </p>

            <div className="rounded-lg overflow-hidden shadow-2xl">
              <Chessboard options={chessboardOptions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
