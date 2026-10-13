export type ChallengeType = "daily" | "weekly";

export type ChallengeDTO = {
  id: string;
  type: ChallengeType;
  fen: string;
  moves: string[];
  rating: number;
  themes: string;
  nextChange: string;
};
