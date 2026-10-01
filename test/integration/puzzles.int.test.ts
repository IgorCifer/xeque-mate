import { beforeEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { createUser } from "./users";
import { resolverPuzzle, seedPuzzle } from "./ops/puzzles";

let diarioId: string;
let semanalId: string;

beforeEach(async () => {
  diarioId = (await seedPuzzle("diario-1", 1500)).id;
  semanalId = (await seedPuzzle("semanal-1", 1800)).id;
});

async function pontosDe(userId: string) {
  return (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).points;
}

describe("desafios", () => {
  it("o puzzle do dia dá 15 pontos uma vez só", async () => {
    const jogador = await createUser();

    await resolverPuzzle(jogador, diarioId, "daily");
    await resolverPuzzle(jogador, diarioId, "daily");

    expect(await prisma.puzzleCompletion.count({ where: { userId: jogador.id } })).toBe(1);
    expect(await pontosDe(jogador.id)).toBe(15);
    expect(await prisma.pointsHistory.count({ where: { userId: jogador.id } })).toBe(1);
  });

  it("o puzzle da semana dá 50 pontos", async () => {
    const jogador = await createUser();

    await resolverPuzzle(jogador, semanalId, "weekly");

    expect(await pontosDe(jogador.id)).toBe(50);
  });

  it("recusa um puzzle que não é o desafio atual", async () => {
    const jogador = await createUser();

    const resposta = await resolverPuzzle(jogador, semanalId, "daily");

    expect(resposta.status).toBe(409);
    expect(await prisma.puzzleCompletion.count({ where: { userId: jogador.id } })).toBe(0);
    expect(await pontosDe(jogador.id)).toBe(0);
  });
});
