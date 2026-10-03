import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { completePuzzle } from "@/features/pontos/internal";
import { getDailyPuzzle, getWeeklyPuzzle } from "@/app/data/get-challenge-puzzle";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { puzzleId, type } = body;

    if (!puzzleId || typeof puzzleId !== "string") {
      return NextResponse.json(
        { error: "puzzleId é obrigatório" },
        { status: 400 }
      );
    }

    if (type !== "daily" && type !== "weekly") {
      return NextResponse.json(
        { error: "type deve ser 'daily' ou 'weekly'" },
        { status: 400 }
      );
    }

    const current =
      type === "daily" ? await getDailyPuzzle() : await getWeeklyPuzzle();

    if (!current || current.id !== puzzleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Este não é o desafio atual. Recarregue a página.",
        },
        { status: 409 }
      );
    }

    const result = await completePuzzle(
      session.user.id,
      puzzleId,
      type
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          alreadyCompleted: result.alreadyCompleted,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      points: result.points,
    });
  } catch (error) {
    console.error("Erro ao completar puzzle:", error);
    return NextResponse.json(
      {
        error: "Erro interno ao processar conclusão do puzzle",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}