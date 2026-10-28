import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { weekStart } from "@/lib/activity";
import { createUser } from "@/test/integration/users";
import { getRankings } from "./dal";

const DAY = 24 * 60 * 60 * 1000;

async function pontuar(userId: string, points: number, createdAt = new Date()) {
  await prisma.pointsHistory.create({ data: { userId, points, reason: "teste", createdAt } });
}

function semanaPassada() {
  return new Date(weekStart(new Date()).getTime() - 1000);
}

describe("ranking semanal", () => {
  it("soma só os pontos desta semana, deixa de fora quem não pontuou e divide a posição no empate", async () => {
    const ana = await createUser("Ana");
    const bruno = await createUser("Bruno");
    const caio = await createUser("Caio");
    const duda = await createUser("Duda");
    await pontuar(ana.id, 10);
    await pontuar(ana.id, 5);
    await pontuar(bruno.id, 15);
    await pontuar(caio.id, 20, semanaPassada());
    await pontuar(caio.id, 3);
    await pontuar(duda.id, 5);
    await pontuar(duda.id, -5);

    const { weekly } = await getRankings({ userId: ana.id });

    expect(weekly.map(({ position, points }) => [position, points])).toEqual([
      [1, 15],
      [1, 15],
      [3, 3],
    ]);
    expect(weekly.map((item) => item.name).sort()).toEqual(["Ana", "Bruno", "Caio"]);
    expect(Object.keys(weekly[0]).sort()).toEqual(["name", "points", "position"]);
  });

  it("dá a posição de quem está agindo contando só quem fez mais pontos", async () => {
    const ana = await createUser("Ana");
    const bruno = await createUser("Bruno");
    const caio = await createUser("Caio");
    const duda = await createUser("Duda");
    await pontuar(ana.id, 15);
    await pontuar(bruno.id, 15);
    await pontuar(caio.id, 3);
    await pontuar(duda.id, 40, semanaPassada());

    expect((await getRankings({ userId: ana.id })).weeklyPosition).toBe(1);
    expect((await getRankings({ userId: bruno.id })).weeklyPosition).toBe(1);
    expect((await getRankings({ userId: caio.id })).weeklyPosition).toBe(3);
    expect((await getRankings({ userId: duda.id })).weeklyPosition).toBeNull();
  });
});

describe("ranking mensal", () => {
  it("soma os pontos dos últimos 30 dias", async () => {
    const ana = await createUser("Ana");
    const bruno = await createUser("Bruno");
    await pontuar(ana.id, 10);
    await pontuar(ana.id, 7, new Date(Date.now() - 31 * DAY));
    await pontuar(bruno.id, 4, semanaPassada());

    const { monthly } = await getRankings({ userId: ana.id });

    expect(monthly).toEqual([
      { position: 1, name: "Ana", points: 10 },
      { position: 2, name: "Bruno", points: 4 },
    ]);
  });

  it("divide a posição no empate", async () => {
    const ana = await createUser("Ana");
    const bruno = await createUser("Bruno");
    const caio = await createUser("Caio");
    await pontuar(ana.id, 10);
    await pontuar(bruno.id, 10);
    await pontuar(caio.id, 4);

    const { monthly } = await getRankings({ userId: ana.id });

    expect(monthly.map(({ position, points }) => [position, points])).toEqual([
      [1, 10],
      [1, 10],
      [3, 4],
    ]);
  });
});

describe("ranking de todos os tempos", () => {
  it("ordena todos os usuários pelos pontos acumulados", async () => {
    const ana = await createUser("Ana");
    const bruno = await createUser("Bruno");
    await createUser("Caio");
    await prisma.user.update({ where: { id: ana.id }, data: { points: 50 } });
    await prisma.user.update({ where: { id: bruno.id }, data: { points: 80 } });

    const { allTime } = await getRankings({ userId: ana.id });

    expect(allTime).toEqual([
      { position: 1, name: "Bruno", points: 80 },
      { position: 2, name: "Ana", points: 50 },
      { position: 3, name: "Caio", points: 0 },
    ]);
  });

  it("divide a posição no empate", async () => {
    const ana = await createUser("Ana");
    const bruno = await createUser("Bruno");
    const caio = await createUser("Caio");
    await prisma.user.update({ where: { id: ana.id }, data: { points: 30 } });
    await prisma.user.update({ where: { id: bruno.id }, data: { points: 30 } });
    await prisma.user.update({ where: { id: caio.id }, data: { points: 12 } });

    const { allTime } = await getRankings({ userId: ana.id });

    expect(allTime.map(({ position, points }) => [position, points])).toEqual([
      [1, 30],
      [1, 30],
      [3, 12],
    ]);
  });
});
