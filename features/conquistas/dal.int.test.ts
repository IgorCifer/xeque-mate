import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { createUser } from "@/test/integration/users";
import { getStreaks, recordDailyActivity } from "./dal";

describe("dias de uso", () => {
  it("registra um dia por usuário, mesmo chamando várias vezes", async () => {
    const jogador = await createUser();

    await recordDailyActivity({ userId: jogador.id });
    await recordDailyActivity({ userId: jogador.id });

    expect(await prisma.userActivityDay.count({ where: { userId: jogador.id } })).toBe(1);
  });

  it("avisa só quando grava um dia novo, e a sequência já conta o dia de hoje", async () => {
    const jogador = await createUser();
    const actor = { userId: jogador.id };

    expect(await getStreaks(actor)).toEqual({ currentStreak: 0, longestStreak: 0 });

    expect((await recordDailyActivity(actor)).newDay).toBe(true);
    expect((await recordDailyActivity(actor)).newDay).toBe(false);

    expect(await getStreaks(actor)).toEqual({ currentStreak: 1, longestStreak: 1 });
  });
});
