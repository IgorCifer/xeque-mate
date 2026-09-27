import type { ResultadoPartida } from "@/app/generated/prisma2/enums";
import { deltaFromResultado } from "@/lib/match-results";

export type RankingParticipante = {
  id: string;
  pontos: number;
  vitorias: number;
};

export type RankingPartida = {
  whiteId: string;
  blackId: string | null;
  resultado: ResultadoPartida | null;
};

export type Desempate = {
  buchholz: number;
  sonnebornBerger: number;
};

export type Classificado<T> = T & Desempate & { posicao: number };

export function compareTournamentRanking(
  a: RankingParticipante & Desempate,
  b: RankingParticipante & Desempate
): number {
  if (b.pontos !== a.pontos) return b.pontos - a.pontos;
  if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
  if (b.sonnebornBerger !== a.sonnebornBerger) return b.sonnebornBerger - a.sonnebornBerger;
  return b.vitorias - a.vitorias;
}

export function rankTournament<T extends RankingParticipante>(
  participantes: readonly T[],
  partidas: readonly RankingPartida[]
): Classificado<T>[] {
  const pontos = new Map(participantes.map((p) => [p.id, p.pontos]));
  const desempates = new Map<string, Desempate>(
    participantes.map((p) => [p.id, { buchholz: 0, sonnebornBerger: 0 }])
  );

  const somar = (jogadorId: string, adversarioId: string, pontosNaPartida: number) => {
    const desempate = desempates.get(jogadorId);
    const pontosAdversario = pontos.get(adversarioId);
    if (!desempate || pontosAdversario === undefined) return;
    desempate.buchholz += pontosAdversario;
    desempate.sonnebornBerger += pontosNaPartida * pontosAdversario;
  };

  for (const partida of partidas) {
    if (!partida.blackId || !partida.resultado) continue;
    somar(partida.whiteId, partida.blackId, deltaFromResultado(partida.resultado, "WHITE").pontos);
    somar(partida.blackId, partida.whiteId, deltaFromResultado(partida.resultado, "BLACK").pontos);
  }

  const ordenados = participantes
    .map((p) => ({ ...p, ...(desempates.get(p.id) ?? { buchholz: 0, sonnebornBerger: 0 }) }))
    .sort(compareTournamentRanking);

  let posicao = 0;
  return ordenados.map((p, i) => {
    if (i === 0 || compareTournamentRanking(ordenados[i - 1], p) !== 0) posicao = i + 1;
    return { ...p, posicao };
  });
}
