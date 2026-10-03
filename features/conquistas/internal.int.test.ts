import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { activityDay } from "@/lib/activity";
import { createUser } from "@/test/integration/users";
import { ACHIEVEMENT_IDS } from "./domain/rules";
import { calculateStreaks, recordDailyLogin, recordTournamentJoined } from "./internal";

describe("conquistas", () => {
  it("desbloqueia o Primeiro Torneio uma vez só", async () => {
    const jogador = await createUser();
    await prisma.torneio.create({
      data: {
        nome: "Conquistas",
        data: new Date("2099-01-01T00:00:00Z"),
        modo: "Blitz",
        criadorId: jogador.id,
        participantes: { create: { userId: jogador.id } },
      },
    });

    const primeira = await recordTournamentJoined(jogador.id);
    const segunda = await recordTournamentJoined(jogador.id);

    expect(primeira.map((a) => a.id)).toEqual([ACHIEVEMENT_IDS.FIRST_TOURNAMENT]);
    expect(segunda).toEqual([]);
    expect(await prisma.userAchievement.count({ where: { userId: jogador.id } })).toBe(1);
  });

  it("três dias seguidos de uso dão o Começo da Jornada", async () => {
    const jogador = await createUser();
    const hoje = new Date(`${activityDay(new Date())}T00:00:00Z`);
    const dia = (atras: number) => new Date(hoje.getTime() - atras * 24 * 60 * 60 * 1000);
    await prisma.userActivityDay.createMany({
      data: [{ userId: jogador.id, day: dia(1) }, { userId: jogador.id, day: dia(2) }],
    });

    const desbloqueadas = await recordDailyLogin(jogador.id);

    expect(desbloqueadas.map((a) => a.id)).toContain(ACHIEVEMENT_IDS.JOURNEY_START);
    expect(await calculateStreaks(jogador.id)).toEqual({ currentStreak: 3, longestStreak: 3 });
  });
});
