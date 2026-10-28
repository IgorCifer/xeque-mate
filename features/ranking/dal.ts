import "server-only";
import prisma from "@/lib/prisma";
import { weekStart } from "@/lib/activity";
import type { Actor } from "@/lib/session";
import { withTiedPositions } from "./domain/positions";
import type { RankItemDTO, RankingsDTO } from "./types";

const RANKING_LIMIT = 50;

async function namesById(userIds: string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  return new Map(users.map((user) => [user.id, user.name]));
}

async function allTimeRanking(): Promise<RankItemDTO[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ points: "desc" }, { id: "asc" }],
    take: RANKING_LIMIT,
    select: { name: true, points: true },
  });
  return withTiedPositions(users);
}

type PointsSum = { userId: string; _sum: { points: number | null } };

async function withNames(sums: PointsSum[]): Promise<RankItemDTO[]> {
  const names = await namesById(sums.map((sum) => sum.userId));
  return withTiedPositions(
    sums.map((sum) => ({
      name: names.get(sum.userId) ?? "Usuário",
      points: sum._sum.points ?? 0,
    })),
  );
}

async function weeklyRanking(since: Date): Promise<RankItemDTO[]> {
  const sums = await prisma.pointsHistory.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
    _sum: { points: true },
    having: { points: { _sum: { gt: 0 } } },
    orderBy: [{ _sum: { points: "desc" } }, { userId: "asc" }],
    take: RANKING_LIMIT,
  });
  return withNames(sums);
}

async function monthlyRanking(since: Date): Promise<RankItemDTO[]> {
  const sums = await prisma.pointsHistory.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
    _sum: { points: true },
    orderBy: [{ _sum: { points: "desc" } }, { userId: "asc" }],
    take: RANKING_LIMIT,
  });
  return withNames(sums);
}

async function weeklyPosition(userId: string, since: Date): Promise<number | null> {
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

export async function getRankings(actor: Actor): Promise<RankingsDTO> {
  const now = new Date();
  const week = weekStart(now);
  const month = new Date(now);
  month.setDate(month.getDate() - 30);

  const [weekly, monthly, allTime, position] = await Promise.all([
    weeklyRanking(week),
    monthlyRanking(month),
    allTimeRanking(),
    weeklyPosition(actor.userId, week),
  ]);
  return { weekly, monthly, allTime, weeklyPosition: position };
}
