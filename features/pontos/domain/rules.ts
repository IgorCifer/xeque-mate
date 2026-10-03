export const POINTS_CONFIG = {
  TOURNAMENT_1ST: 100,
  TOURNAMENT_2ND: 60,
  TOURNAMENT_3RD: 30,
  TOURNAMENT_OTHER: 10,
  DAILY_PUZZLE: 15,
  WEEKLY_PUZZLE: 50,
} as const;

export type PointsReason =
  | "tournament_1st"
  | "tournament_2nd"
  | "tournament_3rd"
  | "tournament_other"
  | "daily_puzzle"
  | "weekly_puzzle";

export type Prize = { points: number; reason: PointsReason };

export function tournamentPrize(posicao: number): Prize {
  if (posicao === 1) return { points: POINTS_CONFIG.TOURNAMENT_1ST, reason: "tournament_1st" };
  if (posicao === 2) return { points: POINTS_CONFIG.TOURNAMENT_2ND, reason: "tournament_2nd" };
  if (posicao === 3) return { points: POINTS_CONFIG.TOURNAMENT_3RD, reason: "tournament_3rd" };
  return { points: POINTS_CONFIG.TOURNAMENT_OTHER, reason: "tournament_other" };
}

export function puzzlePrize(type: "daily" | "weekly"): Prize {
  return type === "daily"
    ? { points: POINTS_CONFIG.DAILY_PUZZLE, reason: "daily_puzzle" }
    : { points: POINTS_CONFIG.WEEKLY_PUZZLE, reason: "weekly_puzzle" };
}
