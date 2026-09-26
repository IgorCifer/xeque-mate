import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { awardTournamentPoints } from "@/lib/points";
import type { ResultadoPartida } from "@/app/generated/prisma2/client";

type PlayerSnapshot = {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  pontos: number;
};

type PartidaResumo = {
  id: string;
  rodada: number;
  resultado: ResultadoPartida | null;
  white: PlayerSnapshot;
  black: PlayerSnapshot | null;
};

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const torneio = await prisma.torneio.findUnique({
      where: { id },
      include: {
        participantes: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        },
        partidas: {
          orderBy: [{ rodada: "asc" }, { createdAt: "asc" }],
          include: {
            white: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true }
                }
              }
            },
            black: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true }
                }
              }
            }
          }
        }
      }
    });

    if (!torneio) {
      return NextResponse.json(
        { error: "Torneio não encontrado" },
        { status: 404 }
      );
    }

    // Permitir visualização mesmo se não for participante/criador; ações sensíveis são checadas em endpoints próprios

    // Garante que o criador está cadastrado como participante (e aparece como líder)
    const liderJaParticipa = torneio.participantes.some(
      (p) => p.userId === torneio.criadorId
    );
    let participantes = [...torneio.participantes];
    if (!liderJaParticipa) {
      const created = await prisma.participante.create({
        data: {
          torneioId: torneio.id,
          userId: torneio.criadorId,
          pontos: 0,
          partidas: 0,
          vitorias: 0,
          derrotas: 0,
          empates: 0,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      participantes = [created, ...participantes];
    }

    const { partidas, ...torneioSemPartidas } = torneio;

    const rodadasMap = new Map<number, PartidaResumo[]>();
    partidas.forEach((partida) => {
      const rodadaInfo = rodadasMap.get(partida.rodada) ?? [];
      rodadaInfo.push({
        id: partida.id,
        rodada: partida.rodada,
        resultado: partida.resultado,
        white: {
          id: partida.white.id,
          user: partida.white.user,
          pontos: partida.white.pontos,
        },
        black: partida.black
          ? {
              id: partida.black.id,
              user: partida.black.user,
              pontos: partida.black.pontos,
            }
          : null,
      });
      rodadasMap.set(partida.rodada, rodadaInfo);
    });

    const rodadas = Array.from(rodadasMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([rodada, matches]) => ({ rodada, partidas: matches }));

    const ranking = [...participantes]
      .map((p) => ({
        id: p.id,
        user: p.user,
        pontos: Number(p.pontos ?? 0),
        vitorias: p.vitorias,
        empates: p.empates,
        derrotas: p.derrotas,
        partidas: p.partidas,
      }))
      .sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
        if (a.derrotas !== b.derrotas) return a.derrotas - b.derrotas;
        return (a.user?.name ?? "").localeCompare(b.user?.name ?? "");
      });

    return NextResponse.json({
      ...torneioSemPartidas,
      participantes,
      rodadas,
      ranking,
    });
  } catch (error) {
    console.error("Erro GET /torneios/[id]:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const torneio = await prisma.torneio.findUnique({
      where: { id }
    });

    if (!torneio || torneio.criadorId !== session.user.id) {
      return NextResponse.json(
        { error: "Torneio não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const dataUpdate: Record<string, unknown> = {
      nome: body.nome ?? torneio.nome,
      data: body.data ? new Date(body.data) : torneio.data,
      modo: body.modo ?? torneio.modo,
    };

    if (body.descricao !== undefined) {
      dataUpdate.descricao = body.descricao ?? null;
    }

    // Finalizar é definitivo: não há volta para finalizado = false
    if (body.finalizado === false && torneio.finalizado) {
      return NextResponse.json(
        { error: "Torneio finalizado não pode ser reaberto" },
        { status: 409 }
      );
    }

    if (body.finalizado !== true) {
      const updated = await prisma.torneio.update({
        where: { id },
        data: dataUpdate,
      });
      return NextResponse.json(updated);
    }

    // Finaliza e distribui os pontos na mesma transação. O updateMany só
    // pega o torneio se ele ainda estiver aberto, então uma segunda
    // requisição (ou um clique duplo) não concede pontos de novo.
    const finalizou = await prisma.$transaction(async (tx) => {
      const { count } = await tx.torneio.updateMany({
        where: { id, finalizado: false },
        data: { ...dataUpdate, finalizado: true },
      });
      if (count !== 1) return false;

      const awards = await awardTournamentPoints(tx, id);
      console.log(`Pontos distribuídos no torneio ${id}:`, awards);
      return true;
    });

    if (!finalizou) {
      return NextResponse.json(
        { error: "Torneio já finalizado" },
        { status: 409 }
      );
    }

    const updated = await prisma.torneio.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro PUT /torneios/[id]:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const torneio = await prisma.torneio.findUnique({
      where: { id }
    });

    if (!torneio || torneio.criadorId !== session.user.id) {
      return NextResponse.json(
        { error: "Torneio não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    await prisma.torneio.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Torneio deletado", id });
  } catch (error) {
    console.error("Erro DELETE /torneios/[id]:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}