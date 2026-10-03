import { describe, expect, it } from "vitest";
import { POINTS_CONFIG, puzzlePrize, tournamentPrize } from "./rules";

describe("tournamentPrize", () => {
  it.each([
    [1, POINTS_CONFIG.TOURNAMENT_1ST, "tournament_1st"],
    [2, POINTS_CONFIG.TOURNAMENT_2ND, "tournament_2nd"],
    [3, POINTS_CONFIG.TOURNAMENT_3RD, "tournament_3rd"],
    [4, POINTS_CONFIG.TOURNAMENT_OTHER, "tournament_other"],
    [12, POINTS_CONFIG.TOURNAMENT_OTHER, "tournament_other"],
  ])("posição %i dá %i pontos (%s)", (posicao, points, reason) => {
    expect(tournamentPrize(posicao)).toEqual({ points, reason });
  });
});

describe("puzzlePrize", () => {
  it("diário dá 15 e semanal dá 50", () => {
    expect(puzzlePrize("daily")).toEqual({ points: 15, reason: "daily_puzzle" });
    expect(puzzlePrize("weekly")).toEqual({ points: 50, reason: "weekly_puzzle" });
  });
});
