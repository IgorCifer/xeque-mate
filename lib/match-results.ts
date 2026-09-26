import { ResultadoPartida } from "@/app/generated/prisma2/enums";

export type Papel = "WHITE" | "BLACK";

export type ParticipanteStats = {
  pontos: number;
  vitorias: number;
  derrotas: number;
  empates: number;
  partidas: number;
};

/**
 * Quanto um resultado soma às estatísticas de um jogador. Sem resultado,
 * não soma nada. O bye é gravado como WHITE_WIN sem pretas.
 */
export function deltaFromResultado(
  resultado: ResultadoPartida | null | undefined,
  papel: Papel
): ParticipanteStats {
  if (!resultado) {
    return { pontos: 0, vitorias: 0, derrotas: 0, empates: 0, partidas: 0 };
  }

  if (resultado === ResultadoPartida.DRAW) {
    return {
      pontos: 0.5,
      vitorias: 0,
      derrotas: 0,
      empates: 1,
      partidas: 1,
    };
  }

  const vencedorWhite = resultado === ResultadoPartida.WHITE_WIN;
  const vencedorBlack = resultado === ResultadoPartida.BLACK_WIN;
  const venceu = (papel === "WHITE" && vencedorWhite) || (papel === "BLACK" && vencedorBlack);
  const perdeu = (papel === "WHITE" && vencedorBlack) || (papel === "BLACK" && vencedorWhite);

  return {
    pontos: venceu ? 1 : 0,
    vitorias: venceu ? 1 : 0,
    derrotas: perdeu ? 1 : 0,
    empates: 0,
    partidas: 1,
  };
}

/**
 * Incremento a aplicar nas estatísticas quando o resultado de uma partida
 * muda de `anterior` para `novo`: desfaz o anterior e aplica o novo.
 */
export function resultadoChangeDelta(
  anterior: ResultadoPartida | null | undefined,
  novo: ResultadoPartida | null | undefined,
  papel: Papel
): ParticipanteStats {
  const prev = deltaFromResultado(anterior, papel);
  const next = deltaFromResultado(novo, papel);

  return {
    pontos: next.pontos - prev.pontos,
    vitorias: next.vitorias - prev.vitorias,
    derrotas: next.derrotas - prev.derrotas,
    empates: next.empates - prev.empates,
    partidas: next.partidas - prev.partidas,
  };
}
