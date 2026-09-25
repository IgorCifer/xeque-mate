import prisma from "@/lib/prisma";

// IDs fixos das conquistas
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

/**
 * Serviço centralizado para gerenciar conquistas
 */
export class AchievementService {
  /**
   * Calcula o progresso do usuário baseado nos dados existentes
   */
  static async calculateUserProgress(userId: string): Promise<UserProgress> {
    // Conta torneios que o usuário participou
    const tournamentsJoined = await prisma.participante.count({
      where: { userId },
    });

    // Conta vitórias em partidas (usando o campo wins do User)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wins: true },
    });
    const matchWins = user?.wins || 0;

    // Conta torneios vencidos (1º lugar = mais pontos no torneio)
    const participacoes = await prisma.participante.findMany({
      where: { userId },
      include: {
        torneio: {
          include: {
            participantes: {
              orderBy: { pontos: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const tournamentWins = participacoes.filter(
      (p) =>
        p.torneio.finalizado && p.torneio.participantes[0]?.userId === userId
    ).length;

    // Para streaks, vamos calcular baseado em logins (sessions criadas em dias diferentes)
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const uniqueDays = new Set<string>();
    sessions.forEach((s) => {
      const date = new Date(s.createdAt);
      date.setHours(0, 0, 0, 0);
      uniqueDays.add(date.toISOString());
    });

    const sortedDays = Array.from(uniqueDays)
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    for (let i = 0; i < sortedDays.length; i++) {
      const currentDay = sortedDays[i];

      if (i === 0) {
        tempStreak = 1;
        lastDate = currentDay;
      } else if (lastDate) {
        const diffInDays = Math.floor(
          (lastDate.getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffInDays === 1) {
          tempStreak++;
          lastDate = currentDay;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          lastDate = currentDay;
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Current streak é a streak mais recente se o último login foi hoje ou ontem
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sortedDays.length > 0) {
      const daysSinceLastLogin = Math.floor(
        (today.getTime() - sortedDays[0].getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastLogin <= 1) {
        currentStreak = tempStreak;
      }
    }

    return {
      tournamentsJoined,
      matchWins,
      tournamentWins,
      currentStreak,
      longestStreak,
    };
  }

  /**
   * Verifica e desbloqueia conquistas baseado no progresso do usuário
   * @returns Array de conquistas desbloqueadas nesta verificação
   */
  static async checkAndUnlockAchievements(
    userId: string
  ): Promise<UnlockedAchievement[]> {
    const unlockedAchievements: UnlockedAchievement[] = [];

    // Calcular progresso do usuário
    const progress = await this.calculateUserProgress(userId);

    // Buscar conquistas já desbloqueadas
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    // Verificar cada conquista
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

    // Desbloquear conquistas que atendem às condições
    for (const { id, condition } of achievementsToCheck) {
      if (condition && !unlockedIds.has(id)) {
        const achievement = await prisma.achievement.findUnique({
          where: { id },
        });

        if (achievement) {
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: id,
            },
          });

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

  /**
   * Registra participação em torneio
   */
  static async recordTournamentJoined(
    userId: string
  ): Promise<UnlockedAchievement[]> {
    return this.checkAndUnlockAchievements(userId);
  }

  /**
   * Registra vitória em partida de torneio
   */
  static async recordMatchWin(userId: string): Promise<UnlockedAchievement[]> {
    return this.checkAndUnlockAchievements(userId);
  }

  /**
   * Registra vitória em torneio completo
   */
  static async recordTournamentWin(
    userId: string
  ): Promise<UnlockedAchievement[]> {
    return this.checkAndUnlockAchievements(userId);
  }

  /**
   * Registra login diário
   */
  static async recordDailyLogin(
    userId: string
  ): Promise<UnlockedAchievement[]> {
    return this.checkAndUnlockAchievements(userId);
  }

  /**
   * Busca todas as conquistas (desbloqueadas e bloqueadas) para um usuário
   */
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

  /**
   * Busca o progresso do usuário
   */
  static async getUserProgress(userId: string) {
    return this.calculateUserProgress(userId);
  }
}
