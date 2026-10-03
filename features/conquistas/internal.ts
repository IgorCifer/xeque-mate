import "server-only";
import prisma, { type Db } from "@/lib/prisma";
import { ResultadoPartida } from "@/app/generated/prisma2/enums";
import { activityDay, computeStreaks } from "@/lib/activity";
import { rankTournament } from "@/lib/tournament-ranking";
import { achievementsDue, type UserProgress } from "./domain/rules";
import type { Streaks, UnlockedAchievement } from "./types";

export async function calculateStreaks(userId: string, db: Db = prisma): Promise<Streaks> {
  const activity = await db.userActivityDay.findMany({
    where: { userId },
    select: { day: true },
  });
  return computeStreaks(
    activity.map((a) => a.day.toISOString().slice(0, 10)),
    activityDay(new Date()),
  );
}

export async function calculateUserProgress(userId: string, db: Db = prisma): Promise<UserProgress> {
  const tournamentsJoined = await db.participante.count({ where: { userId } });

  const matchWins = await db.partida.count({
    where: {
      torneio: { finalizado: true },
      OR: [
        { resultado: ResultadoPartida.WHITE_WIN, blackId: { not: null }, white: { userId } },
        { resultado: ResultadoPartida.BLACK_WIN, black: { userId } },
      ],
    },
  });

  const participacoes = await db.participante.findMany({
    where: { userId, torneio: { finalizado: true } },
    select: {
      id: true,
      torneio: {
        select: {
          participantes: { select: { id: true, pontos: true, vitorias: true } },
          partidas: { select: { whiteId: true, blackId: true, resultado: true } },
        },
      },
    },
  });

  const tournamentWins = participacoes.filter(
    (p) =>
      rankTournament(p.torneio.participantes, p.torneio.partidas).find((c) => c.id === p.id)
        ?.posicao === 1,
  ).length;

  const { currentStreak, longestStreak } = await calculateStreaks(userId, db);

  return { tournamentsJoined, matchWins, tournamentWins, currentStreak, longestStreak };
}

async function unlockDueAchievements(userId: string, db: Db): Promise<UnlockedAchievement[]> {
  const progress = await calculateUserProgress(userId, db);
  const owned = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const ownedIds = new Set(owned.map((o) => o.achievementId));

  const unlocked: UnlockedAchievement[] = [];
  for (const id of achievementsDue(progress)) {
    if (ownedIds.has(id)) continue;
    const achievement = await db.achievement.findUnique({ where: { id } });
    if (!achievement) continue;
    const { count } = await db.userAchievement.createMany({
      data: [{ userId, achievementId: id }],
      skipDuplicates: true,
    });
    if (count === 0) continue;
    unlocked.push({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
    });
  }
  return unlocked;
}

export async function recordTournamentJoined(userId: string, db: Db = prisma) {
  return unlockDueAchievements(userId, db);
}

export async function recordTournamentFinished(userId: string, db: Db = prisma) {
  return unlockDueAchievements(userId, db);
}

export async function recordDailyLogin(userId: string, db: Db = prisma) {
  await db.userActivityDay.createMany({
    data: [{ userId, day: new Date(`${activityDay(new Date())}T00:00:00Z`) }],
    skipDuplicates: true,
  });
  return unlockDueAchievements(userId, db);
}
