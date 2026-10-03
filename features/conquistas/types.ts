export type UnlockedAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type AchievementDTO = UnlockedAchievement & {
  unlocked: boolean;
  unlockedAt: Date | null;
};

export type Streaks = {
  currentStreak: number;
  longestStreak: number;
};
