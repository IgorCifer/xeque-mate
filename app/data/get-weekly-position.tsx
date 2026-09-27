import prisma from "@/lib/prisma";
import { weekStart } from "@/lib/activity";

export async function getWeeklyPosition(userId: string) {
  const since = weekStart(new Date());

  const mine = await prisma.pointsHistory.aggregate({
    where: { userId, createdAt: { gte: since } },
    _sum: { points: true },
  });
  const points = mine._sum.points ?? 0;
  if (points <= 0) return null;

  const ahead = await prisma.pointsHistory.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
    having: { points: { _sum: { gt: points } } },
  });

  return ahead.length + 1;
}
