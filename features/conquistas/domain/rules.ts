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

export type UserProgress = {
  tournamentsJoined: number;
  matchWins: number;
  tournamentWins: number;
  currentStreak: number;
  longestStreak: number;
};

export function achievementsDue(progress: UserProgress): string[] {
  const rules: [string, boolean][] = [
    [ACHIEVEMENT_IDS.FIRST_TOURNAMENT, progress.tournamentsJoined >= 1],
    [ACHIEVEMENT_IDS.FREQUENT_COMPETITOR, progress.tournamentsJoined >= 5],
    [ACHIEVEMENT_IDS.JOURNEY_START, progress.longestStreak >= 3],
    [ACHIEVEMENT_IDS.DEDICATED, progress.longestStreak >= 7],
    [ACHIEVEMENT_IDS.FIRST_VICTORY, progress.matchWins >= 1],
    [ACHIEVEMENT_IDS.ROUND_CHAMPION, progress.matchWins >= 10],
    [ACHIEVEMENT_IDS.DEBUT_CHAMPION, progress.tournamentWins >= 1],
    [ACHIEVEMENT_IDS.TOURNAMENT_LEGEND, progress.tournamentWins >= 5],
  ];
  return rules.filter(([, due]) => due).map(([id]) => id);
}
