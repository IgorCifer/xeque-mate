import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}

	// Busca todos os torneios que o usuário está participando
	const participacoes = await prisma.participante.findMany({
		where: { userId: session.user.id },
		include: {
			torneio: {
				include: {
					_count: { select: { partidas: true } },
					participantes: {
						include: {
							user: {
								select: { id: true, name: true, email: true, image: true }
							}
						}
					}
				}
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Extrai os torneios
	const torneios = participacoes.map((p) => p.torneio);

	return NextResponse.json(torneios);
}
