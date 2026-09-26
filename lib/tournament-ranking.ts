export type RankingStats = {
  pontos: number;
  vitorias: number;
  derrotas: number;
};

/**
 * Classificação do torneio: pontos (desc), vitórias (desc), derrotas (asc).
 * Em empate total, mantém a ordem recebida.
 */
export function compareTournamentRanking(a: RankingStats, b: RankingStats): number {
  if (b.pontos !== a.pontos) return b.pontos - a.pontos;
  if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
  return a.derrotas - b.derrotas;
}

/** Devolve uma cópia ordenada pela classificação do torneio. */
export function sortTournamentRanking<T extends RankingStats>(participantes: readonly T[]): T[] {
  return [...participantes].sort(compareTournamentRanking);
}
