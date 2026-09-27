import prisma from "@/lib/prisma";
import { ResultadoPartida } from "@/app/generated/prisma2/enums";
import { activityDay, computeStreaks } from "@/lib/activity";
import { rankTournament } from "@/lib/tournament-ranking";

export const ACHIEVEMENT_IDS = {
  FIRST_TOURNAMENT: "c55c466f-8d0d-4889-9d19-75ff60e15467",
  FREQUENT_COMPETITOR: "0fc48b96-1499-4905-be78-37874a6a22e3",
  JOURNEY_START: "caac2f64-59e6-4be9-9b07-a5f390ca1ace",
  DEDICATED: "fbe1873f-3e4c-49f9-a85b-a4fb68e8d09a",
  FIRST_VICTORY: "3fcf0527-c906-4cd1-97b1-b78fe5d9fb2d",
  ROUND_CHAMPION: "6c2ca3d9-1d7d-4ca2-bba5-ca7b33bf185d",
  DEBUT_CHAMPION: "fe3369a7-f76e-4e5d-a7a9-d2fac718ee16",
  TOURNAMENT_LEGEND: "4a77c438-a518-4ce3-af82-cc2a94ac261a",
} as const;

interface UnlockedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface UserProgress {
  tournamentsJoined: number;
  matchWins: number;
  tournamentWins: number;
  currentStreak: number;
  longestStreak: number;
}

export class AchievementService {
  static async calculateStreaks(userId: string) {
    const activity = await prisma.userActivityDay.findMany({
      where: { userId },
      select: { day: true },
    });
    return computeStreaks(
      activity.map((a) => a.day.toISOString().slice(0, 10)),
      activityDay(new Date())
    );
  }

  static async calculateUserProgress(userId: string): Promise<UserProgress> {
    const tournamentsJoined = await prisma.participante.count({
      where: { userId },
    });

    const matchWins = await prisma.partida.count({
      where: {
        torneio: { finalizado: true },
        OR: [
          {
            resultado: ResultadoPartida.WHITE_WIN,
            blackId: { not: null },
            white: { userId },
          },
          { resultado: ResultadoPartida.BLACK_WIN, black: { userId } },
        ],
      },
    });

    const participacoes = await prisma.participante.findMany({
      where: { userId, torneio: { finalizado: true } },
      select: {
        id: true,
        torneio: {
          select: {
            participantes: {
              select: { id: true, pontos: true, vitorias: true },
            },
            partidas: {
              select: { whiteId: true, blackId: true, resultado: true },
            },
          },
        },
      },
    });

    const tournamentWins = participacoes.filter(
      (p) =>
        rankTournament(p.torneio.participantes, p.torneio.partidas).find(
          (c) => c.id === p.id
        )?.posicao === 1
    ).length;

    const { currentStreak, longestStreak } = await this.calculateStreaks(userId);

    return {
      tournamentsJoined,
      matchWins,
      tournamentWins,
      currentStreak,
      longestStreak,
    };
  }

  static async checkAndUnlockAchievements(
    userId: string
  ): Promise<UnlockedAchievement[]> {
    const unlockedAchievements: UnlockedAchievement[] = [];

    const progress = await this.calculateUserProgress(userId);

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    const achievementsToCheck = [
      {
        id: ACHIEVEMENT_IDS.FIRST_TOURNAMENT,
        condition: progress.tournamentsJoined >= 1,
      },
      {
        id: ACHIEVEMENT_IDS.FREQUENT_COMPETITOR,
        condition: progress.tournamentsJoined >= 5,
      },
      {
        id: ACHIEVEMENT_IDS.JOURNEY_START,
        condition: progress.longestStreak >= 3,
      },
      {
        id: ACHIEVEMENT_IDS.DEDICATED,
        condition: progress.longestStreak >= 7,
      },
      {
        id: ACHIEVEMENT_IDS.FIRST_VICTORY,
        condition: progress.matchWins >= 1,
      },
      {
        id: ACHIEVEMENT_IDS.ROUND_CHAMPION,
        condition: progress.matchWins >= 10,
      },
      {
        id: ACHIEVEMENT_IDS.DEBUT_CHAMPION,
        condition: progress.tournamentWins >= 1,
      },
      {
        id: ACHIEVEMENT_IDS.TOURNAMENT_LEGEND,
        condition: progress.tournamentWins >= 5,
      },
    ];

    for (const { id, condition } of achievementsToCheck) {
      if (condition && !unlockedIds.has(id)) {
        const achievement = await prisma.achievement.findUnique({
          where: { id },
        });

        if (achievement) {
          const { count } = await prisma.userAchievement.createMany({
            data: [{ userId, achievementId: id }],
            skipDuplicates: true,
          });
          if (count === 0) continue;

          unlockedAchievements.push({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
          });
        }
      }
    }

    return unlockedAchievements;
  }

  static async recordTournamentJoined(
    userId: string
  ): Promise<UnlockedAchievement[]> {
    return this.checkAndUnlockAchievements(userId);
  }

  static async recordTournamentFinished(
    userId: string
  ): Promise<UnlockedAchievement[]> {
    return this.checkAndUnlockAchievements(userId);
  }

  static async recordDailyLogin(
    userId: string
  ): Promise<UnlockedAchievement[]> {
    await prisma.userActivityDay.createMany({
      data: [{ userId, day: new Date(`${activityDay(new Date())}T00:00:00Z`) }],
      skipDuplicates: true,
    });
    return this.checkAndUnlockAchievements(userId);
  }

  static async getUserAchievements(userId: string) {
    const [allAchievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true, achievedAt: true },
      }),
    ]);

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.achievedAt])
    );

    return allAchievements.map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      icon: achievement.icon,
      description: achievement.description,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) || null,
    }));
  }

  static async getUserProgress(userId: string) {
    return this.calculateUserProgress(userId);
  }
}
