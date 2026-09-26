import { describe, expect, it } from "vitest";
import {
  compareTournamentRanking,
  sortTournamentRanking,
  type RankingStats,
} from "./tournament-ranking";

type Jogador = RankingStats & { nome: string };

const jogador = (nome: string, pontos: number, vitorias: number, derrotas: number): Jogador => ({
  nome,
  pontos,
  vitorias,
  derrotas,
});

const nomes = (jogadores: readonly Jogador[]) => jogadores.map((j) => j.nome);

describe("sortTournamentRanking", () => {
  it("ordena por pontos, do maior para o menor", () => {
    const jogadores = [jogador("A", 1, 1, 2), jogador("B", 3, 3, 0), jogador("C", 2.5, 2, 0)];
    expect(nomes(sortTournamentRanking(jogadores))).toEqual(["B", "C", "A"]);
  });

  it("empate em pontos: mais vitórias fica na frente", () => {
    // 2 pontos cada: A com 1 vitória e 2 empates, B com 2 vitórias e 1 derrota
    const jogadores = [jogador("A", 2, 1, 0), jogador("B", 2, 2, 1)];
    expect(nomes(sortTournamentRanking(jogadores))).toEqual(["B", "A"]);
  });

  it("empate em pontos e vitórias: menos derrotas fica na frente", () => {
    const jogadores = [jogador("A", 2, 2, 2), jogador("B", 2, 2, 1)];
    expect(nomes(sortTournamentRanking(jogadores))).toEqual(["B", "A"]);
  });

  it("vitórias não passam na frente de pontos", () => {
    const jogadores = [jogador("A", 2, 2, 1), jogador("B", 2.5, 1, 0)];
    expect(nomes(sortTournamentRanking(jogadores))).toEqual(["B", "A"]);
  });

  it("derrotas não passam na frente de vitórias", () => {
    const jogadores = [jogador("A", 2, 1, 0), jogador("B", 2, 2, 3)];
    expect(nomes(sortTournamentRanking(jogadores))).toEqual(["B", "A"]);
  });

  it("empate total mantém a ordem recebida", () => {
    const jogadores = [jogador("A", 2, 1, 1), jogador("B", 2, 1, 1), jogador("C", 2, 1, 1)];
    expect(nomes(sortTournamentRanking(jogadores))).toEqual(["A", "B", "C"]);
    expect(nomes(sortTournamentRanking([...jogadores].reverse()))).toEqual(["C", "B", "A"]);
  });

  it("aplica os três critérios juntos", () => {
    const jogadores = [
      jogador("A", 1.5, 1, 1),
      jogador("B", 3, 2, 0),
      jogador("C", 3, 3, 1),
      jogador("D", 3, 2, 1),
      jogador("E", 0, 0, 4),
    ];
    expect(nomes(sortTournamentRanking(jogadores))).toEqual(["C", "B", "D", "A", "E"]);
  });

  it("não altera a lista original e mantém os demais campos", () => {
    const jogadores = [jogador("A", 0, 0, 1), jogador("B", 1, 1, 0)];
    const copia = structuredClone(jogadores);

    const ordenados = sortTournamentRanking(jogadores);

    expect(jogadores).toEqual(copia);
    expect(ordenados).not.toBe(jogadores);
    expect(ordenados[0]).toBe(jogadores[1]);
  });

  it("lista vazia devolve lista vazia", () => {
    expect(sortTournamentRanking([])).toEqual([]);
  });
});

describe("compareTournamentRanking", () => {
  it("negativo quando o primeiro fica na frente, positivo quando fica atrás", () => {
    const melhor = jogador("A", 2, 2, 0);
    const pior = jogador("B", 2, 2, 1);
    expect(compareTournamentRanking(melhor, pior)).toBeLessThan(0);
    expect(compareTournamentRanking(pior, melhor)).toBeGreaterThan(0);
  });

  it("zero em empate total", () => {
    expect(compareTournamentRanking(jogador("A", 2, 1, 1), jogador("B", 2, 1, 1))).toBe(0);
  });
});
