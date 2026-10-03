export type PuzzleType = "daily" | "weekly";

export type TournamentAward = {
  userId: string;
  position: number;
  points: number;
};

export type CompletePuzzleResult =
  | { success: true; message: string; points: number }
  | { success: false; message: string; alreadyCompleted: true };
