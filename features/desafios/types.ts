import type { CompletePuzzleResult } from "@/features/pontos/types";

export type ChallengeType = "daily" | "weekly";

export type ChallengeDTO = {
  id: string;
  type: ChallengeType;
  fen: string;
  moves: string[];
  rating: number;
  themes: string;
  nextChange: string;
  forfeited: boolean;
};

export type CompleteChallengeResult =
  | CompletePuzzleResult
  | { success: false; message: string; forfeited: true };
