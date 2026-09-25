import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Swiss } from "tournament-pairings";
import type { Player } from "tournament-pairings/interfaces";
import { ResultadoPartida } from "@/app/generated/prisma2/client";
import type { Prisma } from "@/app/generated/prisma2/client";

interface ContextParams {
  params: { id: string } | Promise<{ id: string }>;
}

interface PlayerState {
  id: string;
  score: number;
  avoid: Set<string>;
  receivedBye: boolean;
}

function toSwissPlayers(states: Map<string, PlayerState>, shuffle = false): Player[] {
  const players = Array.from(states.values()).map((state) => ({
    id: state.id,
    score: state.score,
    avoid: Array.from(state.avoid),
    receivedBye: state.receivedBye,
  } satisfies Player));

  if (shuffle) {
    for (let i = players.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }
  }

  return players;
}

export async function POST(req: Request, context: ContextParams) {
  const rawParams = context.params as Promise<{ id: string }>;
  const resolved =
    typeof (rawParams as Promise<{ id: string }>).then === "function"
      ? await rawParams
      : (context.params as { id: string });
  const { id } = resolved ?? {};

  if (!id) {
    return NextResponse.json({ error: "ID do torneio não informado" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const roundsRequested = Number(body?.rounds ?? 1);
  if (!Number.isFinite(roundsRequested) || roundsRequested < 1) {
    return NextResponse.json({ error: "Número de rodadas inválido" }, { status: 400 });
  }

  const torneio = await prisma.torneio.findUnique({
    where: { id },
    include: {
      participantes: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      partidas: {
        include: {
          white: true,
          black: true,
        },
      },
    },
  });

  if (!torneio) {
    return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });
  }

  if (torneio.criadorId !== session.user.id) {
    return NextResponse.json({ error: "Somente o criador pode gerar confrontos" }, { status: 403 });
  }

  if (torneio.participantes.length < 2) {
    return NextResponse.json({ error: "É necessário ao menos 2 participantes" }, { status: 400 });
  }

  const avoidMap = new Map<string, Set<string>>();
  const byeSet = new Set<string>();

  for (const partida of torneio.partidas) {
    if (partida.whiteId && partida.blackId) {
      if (!avoidMap.has(partida.whiteId)) avoidMap.set(partida.whiteId, new Set());
      if (!avoidMap.has(partida.blackId)) avoidMap.set(partida.blackId, new Set());
      avoidMap.get(partida.whiteId)!.add(partida.blackId);
      avoidMap.get(partida.blackId)!.add(partida.whiteId);
    } else if (partida.whiteId && !partida.blackId) {
      byeSet.add(partida.whiteId);
    }
  }

  const playerStates = new Map<string, PlayerState>();
  torneio.participantes.forEach((participante) => {
    playerStates.set(participante.id, {
      id: participante.id,
      score: Number(participante.pontos ?? 0),
      avoid: new Set(avoidMap.get(participante.id) ?? []),
      receivedBye: byeSet.has(participante.id),
    });
  });

  const currentRound = torneio.partidas.reduce((max, partida) => Math.max(max, partida.rodada), 0);
  const roundsToCreate = Math.min(Math.floor(roundsRequested), 10);
  const createdRounds: number[] = [];

  for (let offset = 1; offset <= roundsToCreate; offset += 1) {
    const roundNumber = currentRound + offset;
    const swissPlayers = toSwissPlayers(playerStates, roundNumber === 1);

    const matches = Swiss(swissPlayers, roundNumber);
    if (!matches.length) {
      break;
    }

    const payload = matches.map((match) => {
      const whiteId = typeof match.player1 === "string" || typeof match.player1 === "number"
        ? String(match.player1)
        : null;
      const blackId = typeof match.player2 === "string" || typeof match.player2 === "number"
        ? String(match.player2)
        : null;

      if (!whiteId) {
        throw new Error(`Parâmetros inválidos para o pareamento da rodada ${roundNumber}`);
      }

      const data: Prisma.PartidaCreateInput = blackId
        ? {
            rodada: roundNumber,
            resultado: null,
            torneio: { connect: { id } },
            white: { connect: { id: whiteId } },
            black: { connect: { id: blackId } },
          }
        : {
            rodada: roundNumber,
            resultado: ResultadoPartida.WHITE_WIN,
            torneio: { connect: { id } },
            white: { connect: { id: whiteId } },
          };

      return {
        data,
        whiteId,
        blackId,
      };
    });

    await prisma.$transaction(
      payload.map((entry) => prisma.partida.create({ data: entry.data }))
    );

    createdRounds.push(roundNumber);

    const byeUpdates: Prisma.PrismaPromise<unknown>[] = [];

    payload.forEach((entry) => {
      const { whiteId, blackId } = entry;
      const whiteState = whiteId ? playerStates.get(whiteId) : undefined;
      if (!whiteId || !whiteState) return;

      if (blackId) {
        const blackState = playerStates.get(blackId);
        if (!blackState) return;
        whiteState.avoid.add(blackId);
        blackState.avoid.add(whiteId);
      } else {
        whiteState.receivedBye = true;
        whiteState.score += 1;
        byeUpdates.push(
          prisma.participante.update({
            where: { id: whiteId },
            data: {
              pontos: { increment: 1 },
              vitorias: { increment: 1 },
              partidas: { increment: 1 },
            },
          })
        );
      }
    });

    if (byeUpdates.length) {
      await prisma.$transaction(byeUpdates);
    }
  }

  if (!createdRounds.length) {
    return NextResponse.json({ error: "Não foi possível gerar novos confrontos" }, { status: 400 });
  }

  return NextResponse.json({ success: true, rounds: createdRounds });
}

export async function DELETE(req: Request, context: ContextParams) {
  const rawParams = context.params as Promise<{ id: string }>;
  const resolved =
    typeof (rawParams as Promise<{ id: string }>).then === "function"
      ? await rawParams
      : (context.params as { id: string });
  const { id } = resolved ?? {};

  if (!id) {
    return NextResponse.json({ error: "ID do torneio não informado" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const torneio = await prisma.torneio.findUnique({ where: { id } });
  if (!torneio) {
    return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });
  }

  if (torneio.criadorId !== session.user.id) {
    return NextResponse.json({ error: "Somente o criador pode excluir confrontos" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.partida.deleteMany({ where: { torneioId: id } }),
    prisma.participante.updateMany({
      where: { torneioId: id },
      data: { pontos: 0, vitorias: 0, derrotas: 0, empates: 0, partidas: 0 },
    }),
    prisma.torneio.update({ where: { id }, data: { finalizado: false } }),
  ]);

  return NextResponse.json({ success: true });
}
