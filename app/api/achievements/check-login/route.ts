import { auth } from "@/lib/auth";
import { recordDailyLogin } from "@/features/conquistas/internal";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unlockedAchievements = await recordDailyLogin(
      session.user.id
    );

    return NextResponse.json({
      unlockedAchievements,
    });
  } catch (error) {
    console.error("Error checking login achievements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
