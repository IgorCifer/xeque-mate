import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AchievementService } from "@/lib/achievements";

export async function POST(req: Request, { params }: any) {
  const session = await auth.api.getSession({
    headers: Object.fromEntries(req.headers),
  });

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user.id;
  const torneioId = params.id;

  const torneio = await prisma.torneio.findUnique({
    where: { id: torneioId },
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

  // Verifica se já é participante
  const jaExiste = await prisma.participante.findUnique({
    where: {
      torneioId_userId: {
        torneioId,
        userId,
      },
    },
  });

  if (jaExiste) {
    return NextResponse.json({ message: "Você já participa do torneio" });
  }

  // Adiciona como participante
  await prisma.participante.create({
    data: {
      torneioId,
      userId,
    },
  });

  const unlockedAchievements = await AchievementService.recordTournamentJoined(
    userId
  );

  return NextResponse.json({ ok: true, unlockedAchievements });
}
