// app/data/get-alltime-ranking.tsx

import prisma from "@/lib/prisma";

export type RankItem = {
  position: number;
  name: string;
  points: number;
};

/**
 * Ranking All-Time (pontos totais de sempre)
 */
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

/**
 * Ranking Semanal (pontos ganhos nos últimos 7 dias)
 */
export async function getWeeklyRanking(limit = 50): Promise<RankItem[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Agrupa pontos por usuário nos últimos 7 dias
  const userPoints = await prisma.pointsHistory.groupBy({
    by: ["userId"],
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    _sum: {
      points: true,
    },
  });

  // Busca nomes dos usuários
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

  // Mapeia userId -> name
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  // Cria ranking com pontos da semana
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

/**
 * Ranking Mensal (pontos ganhos nos últimos 30 dias)
 */
export async function getMonthlyRanking(limit = 50): Promise<RankItem[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Agrupa pontos por usuário nos últimos 30 dias
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

  // Busca nomes dos usuários
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

  // Mapeia userId -> name
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  // Cria ranking com pontos do mês
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