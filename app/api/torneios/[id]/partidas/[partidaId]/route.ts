import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ResultadoPartida } from "@/app/generated/prisma2/client";

interface ContextParams {
  params:
    | { id: string; partidaId: string }
    | Promise<{ id: string; partidaId: string }>;
}

type Papel = "WHITE" | "BLACK";

function deltaFromResultado(
  resultado: ResultadoPartida | null | undefined,
  papel: Papel
) {
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

export async function PATCH(req: Request, context: ContextParams) {
  const rawParams = context.params as Promise<{ id: string; partidaId: string }>;
  const resolved =
    typeof (rawParams as Promise<{ id: string; partidaId: string }>).then === "function"
      ? await rawParams
      : (context.params as { id: string; partidaId: string });

  const { id, partidaId } = resolved ?? {};

  if (!id || !partidaId) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const resultado = body?.resultado as ResultadoPartida | undefined;

  if (!resultado || !Object.values(ResultadoPartida).includes(resultado)) {
    return NextResponse.json({ error: "Resultado inválido" }, { status: 400 });
  }

  const partida = await prisma.partida.findUnique({
    where: { id: partidaId },
    include: {
      torneio: true,
    },
  });

  if (!partida || partida.torneioId !== id) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
  }

  if (partida.torneio.criadorId !== session.user.id) {
    return NextResponse.json({ error: "Somente o criador pode registrar resultados" }, { status: 403 });
  }

  const whiteDeltaPrev = deltaFromResultado(partida.resultado, "WHITE");
  const blackDeltaPrev = deltaFromResultado(partida.resultado, "BLACK");
  const whiteDeltaNew = deltaFromResultado(resultado, "WHITE");
  const blackDeltaNew = deltaFromResultado(resultado, "BLACK");

  const ops = [] as ReturnType<typeof prisma.participante.update>[];

  if (partida.whiteId) {
    ops.push(
      prisma.participante.update({
        where: { id: partida.whiteId },
        data: {
          pontos: {
            increment: whiteDeltaNew.pontos - whiteDeltaPrev.pontos,
          },
          vitorias: {
            increment: whiteDeltaNew.vitorias - whiteDeltaPrev.vitorias,
          },
          derrotas: {
            increment: whiteDeltaNew.derrotas - whiteDeltaPrev.derrotas,
          },
          empates: {
            increment: whiteDeltaNew.empates - whiteDeltaPrev.empates,
          },
          partidas: {
            increment: whiteDeltaNew.partidas - whiteDeltaPrev.partidas,
          },
        },
      })
    );
  }

  if (partida.blackId) {
    ops.push(
      prisma.participante.update({
        where: { id: partida.blackId },
        data: {
          pontos: {
            increment: blackDeltaNew.pontos - blackDeltaPrev.pontos,
          },
          vitorias: {
            increment: blackDeltaNew.vitorias - blackDeltaPrev.vitorias,
          },
          derrotas: {
            increment: blackDeltaNew.derrotas - blackDeltaPrev.derrotas,
          },
          empates: {
            increment: blackDeltaNew.empates - blackDeltaPrev.empates,
          },
          partidas: {
            increment: blackDeltaNew.partidas - blackDeltaPrev.partidas,
          },
        },
      })
    );
  }

  await prisma.$transaction([
    ...ops,
    prisma.partida.update({
      where: { id: partidaId },
      data: { resultado },
    }),
  ]);

  return NextResponse.json({ success: true });
}
