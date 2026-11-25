import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { describeResult, gameResult } from "./game-result";

function play(moves: string[], fen?: string) {
  const game = new Chess(fen);
  for (const move of moves) game.move(move);
  return game;
}

describe("gameResult", () => {
  it("a partida em andamento não tem resultado", () => {
    expect(gameResult(new Chess())).toBeNull();
    expect(gameResult(play(["e4", "e5", "Qh5", "Nc6"]))).toBeNull();
  });

  it("xeque-mate das brancas", () => {
    const game = play(["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"]);
    expect(gameResult(game)).toEqual({ kind: "checkmate", winner: "w" });
  });

  it("xeque-mate das pretas", () => {
    const game = play(["f3", "e5", "g4", "Qh4#"]);
    expect(gameResult(game)).toEqual({ kind: "checkmate", winner: "b" });
  });

  it("afogamento", () => {
    const game = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(gameResult(game)).toEqual({ kind: "stalemate" });
  });

  it("material insuficiente", () => {
    const game = new Chess("8/8/8/4k3/8/8/8/4K3 w - - 0 1");
    expect(gameResult(game)).toEqual({ kind: "insufficient-material" });
  });

  it("repetição tripla", () => {
    const game = play(["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"]);
    expect(gameResult(game)).toEqual({ kind: "threefold-repetition" });
  });

  it("regra dos 50 lances", () => {
    const game = new Chess("8/8/8/4k3/8/8/8/R3K3 w - - 100 80");
    expect(gameResult(game)).toEqual({ kind: "fifty-moves" });
  });

  it("xeque-mate vale mesmo no lance que completaria os 50", () => {
    const game = play(["Ra8#"], "4k3/8/4K3/8/8/8/8/R7 w - - 99 80");
    expect(gameResult(game)).toEqual({ kind: "checkmate", winner: "w" });
  });
});

describe("describeResult", () => {
  it("diz quem venceu do ponto de vista de quem joga", () => {
    expect(describeResult({ kind: "checkmate", winner: "w" }).title).toBe("Xeque-mate! Você venceu");
    expect(describeResult({ kind: "checkmate", winner: "b" }).title).toBe("Xeque-mate. Você perdeu");
    expect(describeResult({ kind: "checkmate", winner: "b" }, "b").title).toBe("Xeque-mate! Você venceu");
  });

  it("todo empate tem título começando por Empate", () => {
    for (const kind of ["stalemate", "insufficient-material", "threefold-repetition", "fifty-moves"] as const) {
      expect(describeResult({ kind }).title).toMatch(/^Empate/);
    }
  });
});
