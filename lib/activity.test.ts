import { describe, expect, it } from "vitest";
import { activityDay, computeStreaks, weekStart } from "./activity";

describe("activityDay", () => {
  it("usa o dia de Brasília, não o UTC", () => {
    expect(activityDay(new Date("2026-09-28T02:30:00Z"))).toBe("2026-09-27");
    expect(activityDay(new Date("2026-09-28T03:00:00Z"))).toBe("2026-09-28");
  });

  it("formata com zeros à esquerda", () => {
    expect(activityDay(new Date("2026-01-05T15:00:00Z"))).toBe("2026-01-05");
  });
});

describe("weekStart", () => {
  it("é o domingo à meia-noite de Brasília", () => {
    expect(weekStart(new Date("2026-09-30T15:00:00Z")).toISOString()).toBe(
      "2026-09-27T03:00:00.000Z"
    );
  });

  it("no próprio domingo, começa naquele dia", () => {
    expect(weekStart(new Date("2026-09-27T03:00:00Z")).toISOString()).toBe(
      "2026-09-27T03:00:00.000Z"
    );
  });

  it("sábado à noite em Brasília ainda é a semana anterior, mesmo já sendo domingo em UTC", () => {
    expect(weekStart(new Date("2026-09-27T02:59:00Z")).toISOString()).toBe(
      "2026-09-20T03:00:00.000Z"
    );
  });

  it("atravessa a virada de ano", () => {
    expect(weekStart(new Date("2026-01-02T12:00:00Z")).toISOString()).toBe(
      "2025-12-28T03:00:00.000Z"
    );
  });
});

describe("computeStreaks", () => {
  it("sem dias, tudo zero", () => {
    expect(computeStreaks([], "2026-09-27")).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("um dia só, hoje", () => {
    expect(computeStreaks(["2026-09-27"], "2026-09-27")).toEqual({
      currentStreak: 1,
      longestStreak: 1,
    });
  });

  it("dias seguidos até hoje, fora de ordem e repetidos", () => {
    const dias = ["2026-09-27", "2026-09-25", "2026-09-26", "2026-09-26"];
    expect(computeStreaks(dias, "2026-09-27")).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("a sequência atual continua se o último dia foi ontem", () => {
    const dias = ["2026-09-24", "2026-09-25", "2026-09-26"];
    expect(computeStreaks(dias, "2026-09-27")).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("a sequência atual zera depois de um dia sem acesso", () => {
    const dias = ["2026-09-24", "2026-09-25"];
    expect(computeStreaks(dias, "2026-09-27")).toEqual({ currentStreak: 0, longestStreak: 2 });
  });

  it("um buraco quebra a sequência, mas a maior fica guardada", () => {
    const dias = [
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-26",
      "2026-09-27",
    ];
    expect(computeStreaks(dias, "2026-09-27")).toEqual({ currentStreak: 2, longestStreak: 4 });
  });

  it("atravessa a virada de mês e de ano", () => {
    const dias = ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"];
    expect(computeStreaks(dias, "2026-01-02")).toEqual({ currentStreak: 4, longestStreak: 4 });
  });
});
