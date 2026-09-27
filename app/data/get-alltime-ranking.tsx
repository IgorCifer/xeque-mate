import prisma from "@/lib/prisma";
import { weekStart } from "@/lib/activity";
import { withTiedPositions } from "@/lib/ranking";

export type RankItem = {
  position: number;
  name: string;
  points: number;
};

export async function getAllTimeRanking(limit = 50): Promise<RankItem[]> {
  const users = await prisma.user.findMany({
    orderBy: { points: "desc" },
    take: limit,
    select: {
      name: true,
      points: true,
    },
  });

  return users.map((user, index) => ({
    position: index + 1,
    name: user.name,
    points: user.points,
  }));
}

export async function getWeeklyRanking(limit = 50): Promise<RankItem[]> {
  const userPoints = await prisma.pointsHistory.groupBy({
    by: ["userId"],
    where: {
      createdAt: {
        gte: weekStart(new Date()),
      },
    },
    _sum: {
      points: true,
    },
    having: {
      points: { _sum: { gt: 0 } },
    },
    orderBy: [{ _sum: { points: "desc" } }, { userId: "asc" }],
    take: limit,
  });

  const users = await prisma.user.findMany({
    where: {
      id: { in: userPoints.map((up) => up.userId) },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return withTiedPositions(
    userPoints.map((up) => ({
      name: userMap.get(up.userId) || "Usuário",
      points: up._sum.points || 0,
    }))
  );
}

export async function getMonthlyRanking(limit = 50): Promise<RankItem[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const userPoints = await prisma.pointsHistory.groupBy({
    by: ["userId"],
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    _sum: {
      points: true,
    },
  });

  const userIds = userPoints.map((up) => up.userId);
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const ranking = userPoints
    .map((up) => ({
      name: userMap.get(up.userId) || "Usuário",
      points: up._sum.points || 0,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((item, index) => ({
      position: index + 1,
      name: item.name,
      points: item.points,
    }));

  return ranking;
}
