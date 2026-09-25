import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: Request,
  context: { params: { id: string; pid: string } } | { params: Promise<{ id: string; pid: string }> }
) {
  const rawParams = (context.params as Promise<{ id: string; pid: string }>);
  const resolved = typeof rawParams?.then === "function" ? await rawParams : (context.params as { id: string; pid: string });
  const { id, pid } = resolved ?? {};

  if (!id || !pid) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const torneio = await prisma.torneio.findUnique({ where: { id } });
  if (!torneio) {
    return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });
  }

  const participante = await prisma.participante.findUnique({ where: { id: pid } });
  if (!participante || participante.torneioId !== id) {
    return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
  }

  const isLeader = torneio.criadorId === participante.userId;
  const isSelf = participante.userId === session.user.id;
  const isCreatorRequest = torneio.criadorId === session.user.id;

  if (isLeader) {
    return NextResponse.json({ error: "Não é possível remover o líder do torneio" }, { status: 400 });
  }

  // Somente o criador pode remover terceiros; o próprio participante pode sair
  if (!isCreatorRequest && !isSelf) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (isSelf) {
    const partidasCount = await prisma.partida.count({ where: { torneioId: id } });
    if (partidasCount > 0 && !torneio.finalizado) {
      return NextResponse.json(
        { error: "Não é possível sair com confrontos gerados. Aguarde excluir confrontos ou finalizar." },
        { status: 400 }
      );
    }
  }

  await prisma.participante.delete({ where: { id: pid } });
  return NextResponse.json({ success: true });
}
