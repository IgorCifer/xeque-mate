import { describe, expect, it } from "vitest";
import { challengeSeed, formatDateBR, nextChallengeChange } from "./schedule";

const utc = (iso: string) => new Date(`${iso}Z`);

describe("challengeSeed", () => {
  it("o diário é o mesmo da meia-noite às 23h59 de Brasília", () => {
    const inicio = challengeSeed("daily", utc("2026-10-13T03:00:00"));
    expect(challengeSeed("daily", utc("2026-10-13T15:00:00"))).toBe(inicio);
    expect(challengeSeed("daily", utc("2026-10-14T02:59:00"))).toBe(inicio);
  });

  it("o diário troca à meia-noite de Brasília, não à meia-noite UTC", () => {
    const noite = challengeSeed("daily", utc("2026-10-13T23:00:00"));
    expect(challengeSeed("daily", utc("2026-10-14T00:30:00"))).toBe(noite);
    expect(challengeSeed("daily", utc("2026-10-14T03:00:00"))).toBe(noite + 1);
  });

  it("o diário atravessa a virada de ano sem pular", () => {
    const reveillon = challengeSeed("daily", utc("2026-12-31T15:00:00"));
    expect(challengeSeed("daily", utc("2027-01-01T15:00:00"))).toBe(reveillon + 1);
  });

  it("o semanal é o mesmo de domingo 00h a sábado 23h59 de Brasília", () => {
    const domingo = challengeSeed("weekly", utc("2026-10-11T03:00:00"));
    expect(challengeSeed("weekly", utc("2026-10-14T15:00:00"))).toBe(domingo);
    expect(challengeSeed("weekly", utc("2026-10-18T02:59:00"))).toBe(domingo);
    expect(challengeSeed("weekly", utc("2026-10-18T03:00:00"))).toBe(domingo + 1);
  });

  it("sábado às 21h de Brasília ainda é a semana anterior, mesmo já sendo domingo em UTC", () => {
    const sabado = challengeSeed("weekly", utc("2026-10-17T15:00:00"));
    expect(challengeSeed("weekly", utc("2026-10-18T00:00:00"))).toBe(sabado);
  });

  it("o semanal não troca no meio da semana na virada de ano", () => {
    const quarta = challengeSeed("weekly", utc("2026-12-30T15:00:00"));
    expect(challengeSeed("weekly", utc("2027-01-01T15:00:00"))).toBe(quarta);
    expect(challengeSeed("weekly", utc("2027-01-03T03:00:00"))).toBe(quarta + 1);
  });
});

describe("nextChallengeChange", () => {
  it("o diário troca na próxima meia-noite de Brasília", () => {
    expect(nextChallengeChange("daily", utc("2026-10-13T15:30:00"))).toEqual(utc("2026-10-14T03:00:00"));
    expect(nextChallengeChange("daily", utc("2026-10-14T02:30:00"))).toEqual(utc("2026-10-14T03:00:00"));
    expect(nextChallengeChange("daily", utc("2026-10-14T03:00:00"))).toEqual(utc("2026-10-15T03:00:00"));
    expect(nextChallengeChange("daily", utc("2027-01-01T02:59:00"))).toEqual(utc("2027-01-01T03:00:00"));
  });

  it("o semanal troca no próximo domingo à meia-noite de Brasília", () => {
    expect(nextChallengeChange("weekly", utc("2026-10-13T15:00:00"))).toEqual(utc("2026-10-18T03:00:00"));
    expect(nextChallengeChange("weekly", utc("2026-10-18T02:59:00"))).toEqual(utc("2026-10-18T03:00:00"));
  });

  it("no domingo, o semanal aponta para o domingo seguinte", () => {
    expect(nextChallengeChange("weekly", utc("2026-10-18T03:00:00"))).toEqual(utc("2026-10-25T03:00:00"));
  });
});

describe("formatDateBR", () => {
  it("formata como dd/mm/aaaa no dia de Brasília", () => {
    expect(formatDateBR(utc("2026-10-03T15:00:00"))).toBe("03/10/2026");
    expect(formatDateBR(utc("2026-10-18T02:00:00"))).toBe("17/10/2026");
    expect(formatDateBR(utc("2026-10-18T03:00:00"))).toBe("18/10/2026");
  });
});
