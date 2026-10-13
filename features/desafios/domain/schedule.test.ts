import { describe, expect, it } from "vitest";
import {
  challengeSeed,
  dayOfYear,
  formatDateBR,
  nextDailyChange,
  nextWeeklyChange,
  weekOfYear,
} from "./schedule";

const local = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);

describe("dayOfYear", () => {
  it("conta a partir de 1º de janeiro", () => {
    expect(dayOfYear(local(2026, 1, 1))).toBe(1);
    expect(dayOfYear(local(2026, 2, 1))).toBe(32);
    expect(dayOfYear(local(2026, 12, 31))).toBe(365);
  });

  it("não muda ao longo do mesmo dia", () => {
    expect(dayOfYear(local(2026, 10, 13, 0, 0))).toBe(dayOfYear(local(2026, 10, 13, 23, 59)));
  });
});

describe("challengeSeed", () => {
  it("o diário muda todo dia e é o mesmo durante o dia", () => {
    const manha = challengeSeed("daily", local(2026, 10, 13, 8));
    const noite = challengeSeed("daily", local(2026, 10, 13, 22));
    const amanha = challengeSeed("daily", local(2026, 10, 14, 8));
    expect(manha).toBe(noite);
    expect(amanha).toBe(manha + 1);
  });

  it("o semanal é o mesmo de domingo a sábado e muda no domingo seguinte", () => {
    const domingo = challengeSeed("weekly", local(2026, 10, 11));
    const sabado = challengeSeed("weekly", local(2026, 10, 17));
    const proximoDomingo = challengeSeed("weekly", local(2026, 10, 18));
    expect(sabado).toBe(domingo);
    expect(proximoDomingo).toBe(domingo + 1);
  });

  it("usa o ano na semente", () => {
    expect(challengeSeed("daily", local(2026, 1, 1))).toBe(2026001);
    expect(challengeSeed("weekly", local(2026, 1, 1))).toBe(2026 * 100 + weekOfYear(local(2026, 1, 1)));
  });
});

describe("próxima troca", () => {
  it("o diário troca à meia-noite do dia seguinte", () => {
    expect(nextDailyChange(local(2026, 10, 13, 15, 30))).toEqual(local(2026, 10, 14, 0, 0));
    expect(nextDailyChange(local(2026, 12, 31, 23, 59))).toEqual(local(2027, 1, 1, 0, 0));
  });

  it("o semanal troca no próximo domingo à meia-noite", () => {
    expect(nextWeeklyChange(local(2026, 10, 13, 15))).toEqual(local(2026, 10, 18, 0, 0));
    expect(nextWeeklyChange(local(2026, 10, 17, 23, 59))).toEqual(local(2026, 10, 18, 0, 0));
  });

  it("no domingo, o semanal aponta para o domingo seguinte", () => {
    expect(nextWeeklyChange(local(2026, 10, 18, 10))).toEqual(local(2026, 10, 25, 0, 0));
  });
});

describe("formatDateBR", () => {
  it("formata como dd/mm/aaaa", () => {
    expect(formatDateBR(local(2026, 10, 3))).toBe("03/10/2026");
  });
});
