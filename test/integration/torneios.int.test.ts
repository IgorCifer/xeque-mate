import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { createUser, createUsers } from "./users";
import {
  aceitarConvite,
  criarTorneio,
  finalizar,
  gerarRodadas,
  lancarResultado,
  seedTorneio,
  verConvite,
} from "./ops/torneios";

async function placar(participanteId: string) {
  return prisma.participante.findUniqueOrThrow({
    where: { id: participanteId },
    select: { pontos: true, vitorias: true, derrotas: true, empates: true, partidas: true },
  });
}

async function partidaComDoisJogadores(torneioId: string) {
  return prisma.partida.findFirstOrThrow({
    where: { torneioId, blackId: { not: null } },
  });
}

describe("convite", () => {
  it("só mostra o convite para quem está logado", async () => {
    const { torneioId } = await seedTorneio(1);
    const convidado = await createUser("Convidado");

    expect((await verConvite(undefined, torneioId)).status).toBe(401);
    expect((await verConvite(convidado, torneioId)).status).toBe(200);
  });

  it("inscreve o convidado uma vez só, mesmo aceitando de novo", async () => {
    const { torneioId } = await seedTorneio(1);
    const convidado = await createUser("Convidado");

    await aceitarConvite(convidado, torneioId);
    await aceitarConvite(convidado, torneioId);

    const inscricoes = await prisma.participante.count({
      where: { torneioId, userId: convidado.id },
    });
    expect(inscricoes).toBe(1);
  });

  it("recusa um id que não é UUID sem gravar nada", async () => {
    const convidado = await createUser("Convidado");

    const resposta = await aceitarConvite(convidado, "nao-e-uuid");

    expect(resposta.status).toBe(400);
    expect(await prisma.participante.count({ where: { userId: convidado.id } })).toBe(0);
  });

  it("limita a 5 torneios em andamento de outras pessoas", async () => {
    const criadores = await createUsers(6, "Criador");
    const convidado = await createUser("Convidado");
    const torneios: string[] = [];
    for (const criador of criadores) {
      const criado = await criarTorneio(criador);
      torneios.push(criado.json?.id as string);
    }

    for (const torneioId of torneios) {
      await aceitarConvite(convidado, torneioId);
    }

    const inscritos = await prisma.participante.findMany({
      where: { userId: convidado.id },
      select: { torneioId: true },
    });
    expect(inscritos).toHaveLength(5);
    expect(inscritos.map((i) => i.torneioId)).not.toContain(torneios[5]);
  });
});

describe("rodadas", () => {
  it("só o criador gera os confrontos", async () => {
    const { criador, convidados, torneioId } = await seedTorneio(2);

    const recusada = await gerarRodadas(convidados[0], torneioId);
    expect(recusada.status).toBe(403);
    expect(await prisma.partida.count({ where: { torneioId } })).toBe(0);

    await gerarRodadas(criador, torneioId);
    expect(await prisma.partida.count({ where: { torneioId } })).toBe(1);
  });
});

describe("resultado", () => {
  it("editar o resultado não deixa resíduo no placar", async () => {
    const { criador, torneioId } = await seedTorneio(2);
    await gerarRodadas(criador, torneioId);
    const partida = await partidaComDoisJogadores(torneioId);

    await lancarResultado(criador, torneioId, partida.id, "WHITE_WIN");
    await lancarResultado(criador, torneioId, partida.id, "DRAW");
    await lancarResultado(criador, torneioId, partida.id, "BLACK_WIN");

    expect(await placar(partida.whiteId)).toEqual({
      pontos: 0,
      vitorias: 0,
      derrotas: 1,
      empates: 0,
      partidas: 1,
    });
    expect(await placar(partida.blackId!)).toEqual({
      pontos: 1,
      vitorias: 1,
      derrotas: 0,
      empates: 0,
      partidas: 1,
    });
  });

  it("não muda o resultado de um torneio finalizado", async () => {
    const { criador, torneioId } = await seedTorneio(2);
    await gerarRodadas(criador, torneioId);
    const partida = await partidaComDoisJogadores(torneioId);
    await lancarResultado(criador, torneioId, partida.id, "WHITE_WIN");
    await finalizar(criador, torneioId);
    const antes = await placar(partida.whiteId);

    const resposta = await lancarResultado(criador, torneioId, partida.id, "DRAW");

    expect(resposta.status).toBe(409);
    const depois = await prisma.partida.findUniqueOrThrow({ where: { id: partida.id } });
    expect(depois.resultado).toBe("WHITE_WIN");
    expect(await placar(partida.whiteId)).toEqual(antes);
  });
});

describe("finalização", () => {
  it("concede os pontos uma vez só, mesmo com pedidos simultâneos", async () => {
    const { criador, torneioId } = await seedTorneio(3);

    const respostas = await Promise.all(
      Array.from({ length: 5 }, () => finalizar(criador, torneioId)),
    );

    expect(respostas.filter((r) => r.status === 200)).toHaveLength(1);
    expect(await prisma.pointsHistory.count({ where: { referenceId: torneioId } })).toBe(3);
    const participantes = await prisma.participante.findMany({
      where: { torneioId },
      select: { user: { select: { id: true, points: true } } },
    });
    for (const { user } of participantes) {
      const historico = await prisma.pointsHistory.aggregate({
        where: { userId: user.id },
        _sum: { points: true },
      });
      expect(user.points).toBe(historico._sum.points);
    }
  });

  it("não concede pontos quando quem pede não é o criador", async () => {
    const { convidados, torneioId } = await seedTorneio(2);

    await finalizar(convidados[0], torneioId);

    const torneio = await prisma.torneio.findUniqueOrThrow({ where: { id: torneioId } });
    expect(torneio.finalizado).toBe(false);
    expect(await prisma.pointsHistory.count({ where: { referenceId: torneioId } })).toBe(0);
  });
});
