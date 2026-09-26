import { describe, expect, it } from "vitest";
import { ResultadoPartida } from "@/app/generated/prisma2/enums";
import {
  deltaFromResultado,
  resultadoChangeDelta,
  type Papel,
  type ParticipanteStats,
} from "./match-results";

const { WHITE_WIN, BLACK_WIN, DRAW } = ResultadoPartida;

const stats = (
  pontos: number,
  vitorias: number,
  derrotas: number,
  empates: number,
  partidas: number
): ParticipanteStats => ({ pontos, vitorias, derrotas, empates, partidas });

const ZERO = stats(0, 0, 0, 0, 0);
const VITORIA = stats(1, 1, 0, 0, 1);
const DERROTA = stats(0, 0, 1, 0, 1);
const EMPATE = stats(0.5, 0, 0, 1, 1);

function soma(a: ParticipanteStats, b: ParticipanteStats): ParticipanteStats {
  return stats(
    a.pontos + b.pontos,
    a.vitorias + b.vitorias,
    a.derrotas + b.derrotas,
    a.empates + b.empates,
    a.partidas + b.partidas
  );
}

describe("deltaFromResultado", () => {
  it.each([null, undefined])("sem resultado (%s) não soma nada", (resultado) => {
    expect(deltaFromResultado(resultado, "WHITE")).toEqual(ZERO);
    expect(deltaFromResultado(resultado, "BLACK")).toEqual(ZERO);
  });

  it.each<[ResultadoPartida, Papel, ParticipanteStats]>([
    [WHITE_WIN, "WHITE", VITORIA],
    [WHITE_WIN, "BLACK", DERROTA],
    [BLACK_WIN, "WHITE", DERROTA],
    [BLACK_WIN, "BLACK", VITORIA],
    [DRAW, "WHITE", EMPATE],
    [DRAW, "BLACK", EMPATE],
  ])("%s para %s", (resultado, papel, esperado) => {
    expect(deltaFromResultado(resultado, papel)).toEqual(esperado);
  });

  it.each([WHITE_WIN, BLACK_WIN, DRAW])("%s distribui exatamente 1 ponto", (resultado) => {
    const total =
      deltaFromResultado(resultado, "WHITE").pontos +
      deltaFromResultado(resultado, "BLACK").pontos;
    expect(total).toBe(1);
  });

  it("bye (WHITE_WIN sem pretas) vale uma vitória, igual ao crédito dado ao criar a rodada", () => {
    // POST /rodadas credita o bye com pontos +1, vitorias +1, partidas +1.
    expect(deltaFromResultado(WHITE_WIN, "WHITE")).toEqual(stats(1, 1, 0, 0, 1));
  });
});

describe("resultadoChangeDelta", () => {
  it.each<[ResultadoPartida | null, ResultadoPartida, ParticipanteStats, ParticipanteStats]>([
    // anterior, novo, delta das brancas, delta das pretas
    [null, WHITE_WIN, VITORIA, DERROTA],
    [null, DRAW, EMPATE, EMPATE],
    [WHITE_WIN, DRAW, stats(-0.5, -1, 0, 1, 0), stats(0.5, 0, -1, 1, 0)],
    [DRAW, BLACK_WIN, stats(-0.5, 0, 1, -1, 0), stats(0.5, 1, 0, -1, 0)],
    [DRAW, WHITE_WIN, stats(0.5, 1, 0, -1, 0), stats(-0.5, 0, 1, -1, 0)],
    [WHITE_WIN, BLACK_WIN, stats(-1, -1, 1, 0, 0), stats(1, 1, -1, 0, 0)],
    [BLACK_WIN, WHITE_WIN, stats(1, 1, -1, 0, 0), stats(-1, -1, 1, 0, 0)],
  ])("%s → %s", (anterior, novo, brancas, pretas) => {
    expect(resultadoChangeDelta(anterior, novo, "WHITE")).toEqual(brancas);
    expect(resultadoChangeDelta(anterior, novo, "BLACK")).toEqual(pretas);
  });

  it.each([WHITE_WIN, BLACK_WIN, DRAW])("relançar o mesmo resultado (%s) não muda nada", (resultado) => {
    expect(resultadoChangeDelta(resultado, resultado, "WHITE")).toEqual(ZERO);
    expect(resultadoChangeDelta(resultado, resultado, "BLACK")).toEqual(ZERO);
  });

  it("relançar o resultado de um bye não credita a vitória de novo", () => {
    expect(resultadoChangeDelta(WHITE_WIN, WHITE_WIN, "WHITE")).toEqual(ZERO);
  });

  it.each<{ sequencia: ResultadoPartida[] }>([
    { sequencia: [WHITE_WIN, DRAW] },
    { sequencia: [WHITE_WIN, DRAW, BLACK_WIN] },
    { sequencia: [BLACK_WIN, WHITE_WIN, DRAW, BLACK_WIN] },
    { sequencia: [DRAW, DRAW, WHITE_WIN, BLACK_WIN, DRAW] },
  ])("edições em sequência $sequencia terminam iguais ao resultado final, sem resíduo", ({ sequencia }) => {
    for (const papel of ["WHITE", "BLACK"] as const) {
      let acumulado = ZERO;
      let anterior: ResultadoPartida | null = null;
      for (const novo of sequencia) {
        acumulado = soma(acumulado, resultadoChangeDelta(anterior, novo, papel));
        anterior = novo;
      }
      expect(acumulado).toEqual(deltaFromResultado(sequencia.at(-1), papel));
    }
  });
});
