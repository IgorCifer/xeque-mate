import "server-only";
import prisma from "@/lib/prisma";
import type { Actor } from "@/lib/session";
import { calculateStreaks } from "./internal";
import type { AchievementDTO, Streaks } from "./types";

export async function getAchievements(actor: Actor): Promise<AchievementDTO[]> {
  const [all, owned] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({
      where: { userId: actor.userId },
      select: { achievementId: true, achievedAt: true },
    }),
  ]);
  const unlockedAt = new Map(owned.map((o) => [o.achievementId, o.achievedAt]));
  return all.map((a) => ({
    id: a.id,
    title: a.title,
    icon: a.icon,
    description: a.description,
    unlocked: unlockedAt.has(a.id),
    unlockedAt: unlockedAt.get(a.id) ?? null,
  }));
}

export async function getStreaks(actor: Actor): Promise<Streaks> {
  return calculateStreaks(actor.userId);
}
