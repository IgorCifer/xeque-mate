import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { createUsers } from "@/test/integration/users";
import { awardTournamentPoints } from "./internal";

async function seedTorneio(jogadores: number) {
  const users = await createUsers(jogadores);
  const torneio = await prisma.torneio.create({
    data: {
      nome: "Pontos",
      data: new Date("2099-01-01T00:00:00Z"),
      modo: "Blitz",
      criadorId: users[0].id,
      participantes: { create: users.map((u) => ({ userId: u.id })) },
    },
  });
  return { users, torneioId: torneio.id };
}

describe("awardTournamentPoints", () => {
  it("sem transação, concede os pontos e grava o histórico de cada participante", async () => {
    const { users, torneioId } = await seedTorneio(3);

    const awards = await awardTournamentPoints(torneioId);

    expect(awards).toHaveLength(3);
    expect(await prisma.pointsHistory.count({ where: { referenceId: torneioId } })).toBe(3);
    for (const user of users) {
      const { points } = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(points).toBe(awards.find((a) => a.userId === user.id)?.points);
    }
  });

  it("dentro de uma transação desfeita, não sobra ponto nenhum", async () => {
    const { users, torneioId } = await seedTorneio(2);

    await expect(
      prisma.$transaction(async (tx) => {
        await awardTournamentPoints(torneioId, tx);
        throw new Error("desfaz");
      }),
    ).rejects.toThrow("desfaz");

    expect(await prisma.pointsHistory.count({ where: { referenceId: torneioId } })).toBe(0);
    const pontos = await prisma.user.findMany({
      where: { id: { in: users.map((u) => u.id) } },
      select: { points: true },
    });
    expect(pontos.every((p) => p.points === 0)).toBe(true);
  });
});
