import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AchievementService } from "@/lib/achievements";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Faça login para ver o convite" },
      { status: 401 }
    );
  }

  const torneio = await prisma.torneio.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      data: true,
      modo: true,
      finalizado: true,
      _count: { select: { partidas: true } },
    },
  });

  if (!torneio) {
    return NextResponse.json(
      { error: "Torneio não encontrado" },
      { status: 404 }
    );
  }

  if (torneio.finalizado) {
    return NextResponse.json(
      { error: "Torneio já finalizado" },
      { status: 400 }
    );
  }

  if ((torneio._count?.partidas ?? 0) > 0) {
    return NextResponse.json(
      { error: "Confrontos já foram gerados" },
      { status: 400 }
    );
  }

  return NextResponse.json({ torneio });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "ID do torneio inválido" },
        { status: 400 }
      );
    }
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }
    const userId = String(session.user.id);
    console.log("[convite aceitar] userId=", userId, "torneioId=", id);

    const torneio = await prisma.torneio.findUnique({
      where: { id },
      select: {
        id: true,
        finalizado: true,
        _count: { select: { partidas: true } },
      },
    });
    if (!torneio) {
      return NextResponse.json(
        { error: "Torneio não encontrado" },
        { status: 404 }
      );
    }

    if (torneio.finalizado) {
      return NextResponse.json(
        { error: "Torneio já finalizado" },
        { status: 400 }
      );
    }

    if ((torneio._count?.partidas ?? 0) > 0) {
      return NextResponse.json(
        { error: "Confrontos já foram gerados" },
        { status: 400 }
      );
    }

    const participanteExistente = await prisma.participante.findFirst({
      where: { torneioId: id, userId },
    });
    if (participanteExistente) {
      return NextResponse.json(
        { error: "Usuário já é participante" },
        { status: 400 }
      );
    }

    const totalParticipando = await prisma.participante.count({
      where: {
        userId,
        torneio: { finalizado: false, criadorId: { not: userId } },
      },
    });
    if (totalParticipando >= 5) {
      return NextResponse.json(
        { error: "Limite de 5 torneios em andamento participando atingido" },
        { status: 400 }
      );
    }

    const novoParticipante = await prisma.participante.create({
      data: {
        torneioId: id,
        userId,
        pontos: 0,
        partidas: 0,
        vitorias: 0,
        derrotas: 0,
        empates: 0,
      },
    });

    const unlockedAchievements =
      await AchievementService.recordTournamentJoined(userId);

    return NextResponse.json({
      success: true,
      participante: novoParticipante,
      unlockedAchievements,
    });
  } catch (error) {
    console.error("Erro ao aceitar convite", error);
    return NextResponse.json(
      {
        error: "Falha ao aceitar convite",
        detalhe: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
