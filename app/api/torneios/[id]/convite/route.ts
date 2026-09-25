import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AchievementService } from "@/lib/achievements";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  const rawParams = context?.params as Promise<{ id: string }>;
  const resolved =
    typeof rawParams?.then === "function"
      ? await rawParams
      : (context.params as { id: string });
  const { id } = resolved ?? {};

  if (!id) {
    return NextResponse.json(
      { error: "ID do torneio não informado" },
      { status: 400 }
    );
  }

  const torneio = await prisma.torneio.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      data: true,
      modo: true,
      criadorId: true,
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

  // Buscar convite existente
  const convite = await prisma.convite.findFirst({
    where: { torneioId: id },
  });

  if (convite) {
    return NextResponse.json({ convite, torneio });
  }

  // Criar novo convite
  const token = crypto.randomUUID();

  const novoConvite = await prisma.convite.create({
    data: {
      torneioId: id,
      token,
      criadoPorId: torneio.criadorId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    },
  });

  return NextResponse.json({ convite: novoConvite, torneio });
}

// Método POST para aceitar convite
export async function POST(req: Request, context: any) {
  try {
    let id;
    if (context?.params) {
      // Se params for uma Promise, resolva
      const params =
        typeof context.params.then === "function"
          ? await context.params
          : context.params;
      id = params?.id;
    }
    if (!id) {
      return NextResponse.json(
        { error: "ID do torneio não informado" },
        { status: 400 }
      );
    }
    if (!UUID_REGEX.test(String(id))) {
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

    // Verifica se o torneio existe
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

    // Verifica se o usuário já é participante
    const participanteExistente = await prisma.participante.findFirst({
      where: { torneioId: id, userId },
    });
    if (participanteExistente) {
      return NextResponse.json(
        { error: "Usuário já é participante" },
        { status: 400 }
      );
    }

    // Verifica se o usuário já participa de 5 torneios
    const totalParticipando = await prisma.participante.count({
      where: { userId },
    });
    if (totalParticipando >= 5) {
      return NextResponse.json(
        { error: "Limite de 5 torneios participando atingido" },
        { status: 400 }
      );
    }

    // Adiciona usuário como participante
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

    // Desbloqueia conquistas relacionadas a participação em torneio
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
