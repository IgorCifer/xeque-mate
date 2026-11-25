import type { Chess, Color } from "chess.js";

export type GameResult =
  | { kind: "checkmate"; winner: Color }
  | { kind: "stalemate" }
  | { kind: "insufficient-material" }
  | { kind: "threefold-repetition" }
  | { kind: "fifty-moves" };

export function gameResult(game: Chess): GameResult | null {
  if (game.isCheckmate()) {
    return { kind: "checkmate", winner: game.turn() === "w" ? "b" : "w" };
  }
  if (game.isStalemate()) return { kind: "stalemate" };
  if (game.isInsufficientMaterial()) return { kind: "insufficient-material" };
  if (game.isThreefoldRepetition()) return { kind: "threefold-repetition" };
  if (game.isDrawByFiftyMoves()) return { kind: "fifty-moves" };
  return null;
}

export function describeResult(result: GameResult, player: Color = "w") {
  switch (result.kind) {
    case "checkmate":
      return result.winner === player
        ? { title: "Xeque-mate! Você venceu", description: "Seu rei saiu ileso e o adversário não tem defesa." }
        : { title: "Xeque-mate. Você perdeu", description: "Seu rei não tem como escapar do xeque." };
    case "stalemate":
      return { title: "Empate por afogamento", description: "Quem tem a vez não está em xeque, mas não tem nenhum lance legal." };
    case "insufficient-material":
      return { title: "Empate por material insuficiente", description: "Não sobraram peças suficientes para dar xeque-mate." };
    case "threefold-repetition":
      return { title: "Empate por repetição", description: "A mesma posição se repetiu três vezes." };
    case "fifty-moves":
      return { title: "Empate pela regra dos 50 lances", description: "Foram 50 lances de cada lado sem captura nem movimento de peão." };
  }
}
