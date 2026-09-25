import prisma from "@/lib/prisma"

export const getAchievements = async (userId?: string) => {
    if (!userId) {
        // Retorna todas as conquistas sem informação de desbloqueio
        const achievements = await prisma.achievement.findMany();
        return achievements.map(a => ({
            ...a,
            unlocked: false,
            unlockedAt: null,
        }));
    }

    // Retorna conquistas com informação de desbloqueio
    const [allAchievements, userAchievements] = await Promise.all([
        prisma.achievement.findMany(),
        prisma.userAchievement.findMany({
            where: { userId },
            select: { achievementId: true, achievedAt: true },
        }),
    ]);

    const unlockedMap = new Map(
        userAchievements.map(ua => [ua.achievementId, ua.achievedAt])
    );

    return allAchievements.map(achievement => ({
        id: achievement.id,
        title: achievement.title,
        icon: achievement.icon,
        description: achievement.description,
        unlocked: unlockedMap.has(achievement.id),
        unlockedAt: unlockedMap.get(achievement.id) || null,
    }));
}