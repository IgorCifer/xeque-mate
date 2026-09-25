import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ 
      headers: req.headers 
    });

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const torneios = await prisma.torneio.findMany({
      where: { criadorId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { partidas: true } },
      },
    });

    return NextResponse.json(torneios);
  } catch (error) {
    console.error("Erro ao buscar torneios:", error);
    return NextResponse.json(
      { error: "Erro ao buscar torneios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ 
      headers: req.headers 
    });

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.nome || !body.data || !body.modo) {
      return NextResponse.json(
        { error: "Nome, data e modo são obrigatórios" },
        { status: 400 }
      );
    }

    const dataTorneio = new Date(`${body.data}T00:00:00`);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (Number.isNaN(dataTorneio.getTime()) || dataTorneio < hoje) {
      return NextResponse.json(
        { error: "A data não pode estar no passado" },
        { status: 400 }
      );
    }

    const count = await prisma.torneio.count({
      where: { criadorId: session.user.id }
    });

    if (count >= 5) {
      return NextResponse.json(
        { error: "Limite de 5 torneios atingido" },
        { status: 400 }
      );
    }

    const torneio = await prisma.torneio.create({
      data: {
        nome: body.nome,
        data: dataTorneio,
        modo: body.modo,
        descricao: body.descricao ?? null,
        criadorId: session.user.id,
        participantes: {
          create: {
            userId: session.user.id,
            pontos: 0,
            partidas: 0,
            vitorias: 0,
            derrotas: 0,
            empates: 0,
          },
        },
      },
      include: {
        participantes: true,
      },
    });

    return NextResponse.json(torneio, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar torneio:", error);
    return NextResponse.json(
      { error: "Erro ao criar torneio" },
      { status: 500 }
    );
  }
}
