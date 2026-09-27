import { describe, expect, it } from "vitest";
import { ResultadoPartida } from "@/app/generated/prisma2/enums";
import {
  compareTournamentRanking,
  rankTournament,
  type RankingPartida,
} from "./tournament-ranking";

const jogador = (id: string, pontos: number, vitorias = 0) => ({ id, pontos, vitorias });

const partida = (
  whiteId: string,
  blackId: string | null,
  resultado: ResultadoPartida | null
): RankingPartida => ({ whiteId, blackId, resultado });

const ids = (classificados: readonly { id: string }[]) => classificados.map((c) => c.id);
const posicoes = (classificados: readonly { posicao: number }[]) =>
  classificados.map((c) => c.posicao);

describe("rankTournament", () => {
  it("ordena por pontos, do maior para o menor", () => {
    const ranking = rankTournament([jogador("A", 1), jogador("B", 3), jogador("C", 2.5)], []);
    expect(ids(ranking)).toEqual(["B", "C", "A"]);
    expect(posicoes(ranking)).toEqual([1, 2, 3]);
  });

  it("calcula Buchholz e Sonneborn-Berger das partidas", () => {
    const ranking = rankTournament(
      [jogador("A", 1.5, 1), jogador("B", 1, 1), jogador("C", 1), jogador("D", 0.5)],
      [
        partida("A", "B", ResultadoPartida.WHITE_WIN),
        partida("C", "D", ResultadoPartida.DRAW),
        partida("C", "A", ResultadoPartida.DRAW),
        partida("D", "B", ResultadoPartida.BLACK_WIN),
      ]
    );

    expect(ranking.map(({ id, buchholz, sonnebornBerger }) => [id, buchholz, sonnebornBerger])).toEqual([
      ["A", 2, 1.5],
      ["C", 2, 1],
      ["B", 2, 0.5],
      ["D", 2, 0.5],
    ]);
  });

  it("empate em pontos: maior Buchholz fica na frente, mesmo com SB menor", () => {
    const ranking = rankTournament(
      [jogador("A", 3), jogador("B", 1.5), jogador("C", 1.5, 1), jogador("D", 1)],
      [partida("A", "B", ResultadoPartida.WHITE_WIN), partida("C", "D", ResultadoPartida.WHITE_WIN)]
    );
    expect(ids(ranking)).toEqual(["A", "B", "C", "D"]);
  });

  it("empate em pontos e Buchholz: maior SB fica na frente", () => {
    const ranking = rankTournament(
      [jogador("A", 1.5, 1), jogador("B", 1, 1), jogador("C", 1), jogador("D", 0.5)],
      [
        partida("A", "B", ResultadoPartida.WHITE_WIN),
        partida("C", "D", ResultadoPartida.DRAW),
        partida("C", "A", ResultadoPartida.DRAW),
        partida("D", "B", ResultadoPartida.BLACK_WIN),
      ]
    );
    expect(ids(ranking)).toEqual(["A", "C", "B", "D"]);
  });

  it("empate em pontos, Buchholz e SB: mais vitórias fica na frente", () => {
    const ranking = rankTournament([jogador("A", 1, 0), jogador("B", 1, 1)], []);
    expect(ids(ranking)).toEqual(["B", "A"]);
    expect(posicoes(ranking)).toEqual([1, 2]);
  });

  it("bye e partida sem resultado não contam no desempate", () => {
    const ranking = rankTournament(
      [jogador("A", 1, 1), jogador("B", 0)],
      [partida("A", null, ResultadoPartida.WHITE_WIN), partida("A", "B", null)]
    );
    expect(ranking.map(({ buchholz, sonnebornBerger }) => [buchholz, sonnebornBerger])).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("empate total divide a posição e pula as seguintes", () => {
    const ranking = rankTournament(
      [jogador("A", 2, 2), jogador("B", 1, 1), jogador("C", 1, 1), jogador("D", 0)],
      []
    );
    expect(posicoes(ranking)).toEqual([1, 2, 2, 4]);
  });

  it("empate total no topo deixa todos em 1º", () => {
    const ranking = rankTournament(
      [jogador("A", 1, 1), jogador("B", 1, 1), jogador("C", 1, 1), jogador("D", 0)],
      []
    );
    expect(posicoes(ranking)).toEqual([1, 1, 1, 4]);
  });

  it("não altera a lista original e mantém os demais campos", () => {
    const jogadores = [
      { ...jogador("A", 0), nome: "Ana" },
      { ...jogador("B", 1, 1), nome: "Bia" },
    ];
    const copia = structuredClone(jogadores);

    const ranking = rankTournament(jogadores, []);

    expect(jogadores).toEqual(copia);
    expect(ranking[0]).toEqual({
      id: "B",
      pontos: 1,
      vitorias: 1,
      nome: "Bia",
      buchholz: 0,
      sonnebornBerger: 0,
      posicao: 1,
    });
  });

  it("lista vazia devolve lista vazia", () => {
    expect(rankTournament([], [])).toEqual([]);
  });
});

describe("compareTournamentRanking", () => {
  const desempate = (pontos: number, buchholz: number, sonnebornBerger: number, vitorias: number) => ({
    id: "X",
    pontos,
    vitorias,
    buchholz,
    sonnebornBerger,
  });

  it("negativo quando o primeiro fica na frente, positivo quando fica atrás", () => {
    const melhor = desempate(2, 3, 1, 1);
    const pior = desempate(2, 2, 4, 2);
    expect(compareTournamentRanking(melhor, pior)).toBeLessThan(0);
    expect(compareTournamentRanking(pior, melhor)).toBeGreaterThan(0);
  });

  it("zero em empate total", () => {
    expect(compareTournamentRanking(desempate(2, 3, 1, 1), desempate(2, 3, 1, 1))).toBe(0);
  });
});
