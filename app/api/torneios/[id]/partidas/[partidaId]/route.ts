import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ResultadoPartida } from "@/app/generated/prisma2/client";
import { resultadoChangeDelta } from "@/lib/match-results";

interface ContextParams {
  params:
    | { id: string; partidaId: string }
    | Promise<{ id: string; partidaId: string }>;
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

  const whiteDelta = resultadoChangeDelta(partida.resultado, resultado, "WHITE");
  const blackDelta = resultadoChangeDelta(partida.resultado, resultado, "BLACK");

  const ops = [] as ReturnType<typeof prisma.participante.update>[];

  if (partida.whiteId) {
    ops.push(
      prisma.participante.update({
        where: { id: partida.whiteId },
        data: {
          pontos: { increment: whiteDelta.pontos },
          vitorias: { increment: whiteDelta.vitorias },
          derrotas: { increment: whiteDelta.derrotas },
          empates: { increment: whiteDelta.empates },
          partidas: { increment: whiteDelta.partidas },
        },
      })
    );
  }

  if (partida.blackId) {
    ops.push(
      prisma.participante.update({
        where: { id: partida.blackId },
        data: {
          pontos: { increment: blackDelta.pontos },
          vitorias: { increment: blackDelta.vitorias },
          derrotas: { increment: blackDelta.derrotas },
          empates: { increment: blackDelta.empates },
          partidas: { increment: blackDelta.partidas },
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
