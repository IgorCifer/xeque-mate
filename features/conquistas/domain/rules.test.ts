import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_IDS, achievementsDue, type UserProgress } from "./rules";

const zero: UserProgress = {
  tournamentsJoined: 0,
  matchWins: 0,
  tournamentWins: 0,
  currentStreak: 0,
  longestStreak: 0,
};

describe("achievementsDue", () => {
  it("nada sem progresso", () => {
    expect(achievementsDue(zero)).toEqual([]);
  });

  it.each([
    ["Primeiro Torneio", { tournamentsJoined: 1 }, ACHIEVEMENT_IDS.FIRST_TOURNAMENT],
    ["Competidor Frequente", { tournamentsJoined: 5 }, ACHIEVEMENT_IDS.FREQUENT_COMPETITOR],
    ["Começo da Jornada", { longestStreak: 3 }, ACHIEVEMENT_IDS.JOURNEY_START],
    ["Dedicado", { longestStreak: 7 }, ACHIEVEMENT_IDS.DEDICATED],
    ["Primeira Vitória", { matchWins: 1 }, ACHIEVEMENT_IDS.FIRST_VICTORY],
    ["Campeão de Rodada", { matchWins: 10 }, ACHIEVEMENT_IDS.ROUND_CHAMPION],
    ["Campeão Estreante", { tournamentWins: 1 }, ACHIEVEMENT_IDS.DEBUT_CHAMPION],
    ["Lenda dos Torneios", { tournamentWins: 5 }, ACHIEVEMENT_IDS.TOURNAMENT_LEGEND],
  ])("%s no limite", (_nome, parcial, id) => {
    expect(achievementsDue({ ...zero, ...parcial })).toContain(id);
  });

  it("não conta a sequência atual, só a maior", () => {
    expect(achievementsDue({ ...zero, currentStreak: 3, longestStreak: 2 })).toEqual([]);
  });

  it("logo abaixo do limite não desbloqueia", () => {
    const due = achievementsDue({ ...zero, tournamentsJoined: 4, longestStreak: 6, matchWins: 9, tournamentWins: 4 });
    expect(due).not.toContain(ACHIEVEMENT_IDS.FREQUENT_COMPETITOR);
    expect(due).not.toContain(ACHIEVEMENT_IDS.DEDICATED);
    expect(due).not.toContain(ACHIEVEMENT_IDS.ROUND_CHAMPION);
    expect(due).not.toContain(ACHIEVEMENT_IDS.TOURNAMENT_LEGEND);
  });
});
