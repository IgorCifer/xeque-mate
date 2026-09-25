import { auth } from "@/lib/auth";
import { AchievementService } from "@/lib/achievements";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/achievements
 * Retorna todas as conquistas do usuário (desbloqueadas e bloqueadas)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const achievements = await AchievementService.getUserAchievements(
      session.user.id
    );
    const progress = await AchievementService.getUserProgress(session.user.id);

    return NextResponse.json({
      achievements,
      progress: progress || {
        tournamentsJoined: 0,
        matchWins: 0,
        tournamentWins: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
