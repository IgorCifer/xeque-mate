import { beforeEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { ConflictError } from "@/lib/errors";
import { createUser, type TestUser } from "@/test/integration/users";
import { completeChallenge, forfeitChallenge, getChallenge } from "./dal";
import type { ChallengeType } from "./types";

let diarioId: string;
let semanalId: string;

async function seedPuzzle(externalId: string, rating: number) {
  return prisma.puzzle.create({
    data: {
      externalId,
      fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
      moves: "d1d8 g8h7",
      rating,
      ratingDeviation: 75,
      popularity: 95,
      nbPlays: 5000,
      themes: "mateIn1",
    },
  });
}

function resolverPuzzle(user: TestUser, puzzleId: string, type: ChallengeType) {
  return completeChallenge({ userId: user.id }, { puzzleId, type });
}

function perderPontos(user: TestUser, puzzleId: string, type: ChallengeType) {
  return forfeitChallenge({ userId: user.id }, { puzzleId, type });
}

async function pontosDe(userId: string) {
  return (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).points;
}

beforeEach(async () => {
  diarioId = (await seedPuzzle("diario-1", 1500)).id;
  semanalId = (await seedPuzzle("semanal-1", 1800)).id;
});

describe("desafios", () => {
  it("devolve o puzzle da faixa de cada desafio, com os lances separados", async () => {
    const jogador = await createUser();

    const diario = await getChallenge({ userId: jogador.id }, "daily");
    const semanal = await getChallenge({ userId: jogador.id }, "weekly");

    expect(diario).toMatchObject({ id: diarioId, type: "daily", rating: 1500, moves: ["d1d8", "g8h7"] });
    expect(semanal).toMatchObject({ id: semanalId, type: "weekly", rating: 1800 });
    expect(new Date(diario!.nextChange).getTime()).toBeGreaterThan(Date.now());
  });

  it("sem puzzles na faixa, não há desafio", async () => {
    await prisma.puzzle.deleteMany();
    const jogador = await createUser();

    expect(await getChallenge({ userId: jogador.id }, "daily")).toBeNull();
  });

  it("o puzzle do dia dá 15 pontos uma vez só", async () => {
    const jogador = await createUser();

    const primeira = await resolverPuzzle(jogador, diarioId, "daily");
    const segunda = await resolverPuzzle(jogador, diarioId, "daily");

    expect(primeira).toMatchObject({ success: true, points: 15 });
    expect(segunda).toMatchObject({ success: false, alreadyCompleted: true });
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

    await expect(resolverPuzzle(jogador, semanalId, "daily")).rejects.toBeInstanceOf(ConflictError);

    expect(await prisma.puzzleCompletion.count({ where: { userId: jogador.id } })).toBe(0);
    expect(await pontosDe(jogador.id)).toBe(0);
  });
});

describe("perda de pontos por dica, reinício ou lance errado", () => {
  it("depois da perda, resolver o puzzle não dá pontos", async () => {
    const jogador = await createUser();

    await perderPontos(jogador, diarioId, "daily");
    const resultado = await resolverPuzzle(jogador, diarioId, "daily");

    expect(resultado).toMatchObject({ success: false, forfeited: true });
    expect(await prisma.puzzleCompletion.count({ where: { userId: jogador.id } })).toBe(0);
    expect(await pontosDe(jogador.id)).toBe(0);
    expect(await prisma.pointsHistory.count({ where: { userId: jogador.id } })).toBe(0);
  });

  it("a perda vale depois de recarregar a página", async () => {
    const jogador = await createUser();

    expect(await getChallenge({ userId: jogador.id }, "daily")).toMatchObject({ forfeited: false });
    await perderPontos(jogador, diarioId, "daily");

    expect(await getChallenge({ userId: jogador.id }, "daily")).toMatchObject({ forfeited: true });
  });

  it("registrar a perda várias vezes, inclusive ao mesmo tempo, grava uma vez só", async () => {
    const jogador = await createUser();

    await Promise.all([1, 2, 3].map(() => perderPontos(jogador, diarioId, "daily")));
    await perderPontos(jogador, diarioId, "daily");

    expect(await prisma.puzzleForfeit.count({ where: { userId: jogador.id } })).toBe(1);
  });

  it("a perda vale só para quem perdeu e só para aquele desafio", async () => {
    const jogador = await createUser();
    const outro = await createUser();

    await perderPontos(jogador, diarioId, "daily");

    expect(await resolverPuzzle(outro, diarioId, "daily")).toMatchObject({ success: true, points: 15 });
    expect(await resolverPuzzle(jogador, semanalId, "weekly")).toMatchObject({ success: true, points: 50 });
    expect(await pontosDe(jogador.id)).toBe(50);
  });

  it("reiniciar depois de resolver com pontos não marca perda", async () => {
    const jogador = await createUser();

    await resolverPuzzle(jogador, diarioId, "daily");
    await perderPontos(jogador, diarioId, "daily");

    expect(await prisma.puzzleForfeit.count({ where: { userId: jogador.id } })).toBe(0);
    expect(await getChallenge({ userId: jogador.id }, "daily")).toMatchObject({ forfeited: false });
    expect(await pontosDe(jogador.id)).toBe(15);
  });

  it("recusa registrar perda de um puzzle que não é o desafio atual", async () => {
    const jogador = await createUser();

    await expect(perderPontos(jogador, semanalId, "daily")).rejects.toBeInstanceOf(ConflictError);

    expect(await prisma.puzzleForfeit.count({ where: { userId: jogador.id } })).toBe(0);
  });
});
