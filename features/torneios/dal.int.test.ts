import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { ConflictError, NotFoundError, RuleViolationError } from "@/lib/errors";
import { createUser, createUsers } from "@/test/integration/users";
import { criarTorneio, gerarRodadas, seedTorneio } from "@/test/integration/ops/torneios";
import { acceptConvite, getConvite } from "./dal";

describe("convite", () => {
  it("mostra o torneio aberto a quem tem o link", async () => {
    const { torneioId } = await seedTorneio(1);
    const convidado = await createUser("Convidado");

    const convite = await getConvite({ userId: convidado.id }, torneioId);

    expect(convite).toEqual({ id: torneioId, nome: "Torneio de teste", data: expect.any(Date) });
  });

  it("recusa torneio inexistente, finalizado ou com confrontos gerados", async () => {
    const convidado = await createUser("Convidado");
    const actor = { userId: convidado.id };
    const finalizado = await seedTorneio(1);
    await prisma.torneio.update({ where: { id: finalizado.torneioId }, data: { finalizado: true } });
    const emDisputa = await seedTorneio(2);
    await gerarRodadas(emDisputa.criador, emDisputa.torneioId);

    await expect(getConvite(actor, "5b0f8c9e-2f7e-4c55-9a4f-1b2c3d4e5f60")).rejects.toBeInstanceOf(NotFoundError);
    await expect(getConvite(actor, finalizado.torneioId)).rejects.toThrow("Torneio já finalizado");
    await expect(getConvite(actor, emDisputa.torneioId)).rejects.toThrow("Confrontos já foram gerados");

    await expect(acceptConvite(actor, finalizado.torneioId)).rejects.toBeInstanceOf(ConflictError);
    await expect(acceptConvite(actor, emDisputa.torneioId)).rejects.toBeInstanceOf(ConflictError);
    expect(await prisma.participante.count({ where: { userId: convidado.id } })).toBe(0);
  });

  it("inscreve o convidado uma vez só, mesmo aceitando de novo", async () => {
    const { torneioId } = await seedTorneio(1);
    const convidado = await createUser("Convidado");

    await acceptConvite({ userId: convidado.id }, torneioId);
    await expect(acceptConvite({ userId: convidado.id }, torneioId)).rejects.toBeInstanceOf(ConflictError);

    const inscricoes = await prisma.participante.count({
      where: { torneioId, userId: convidado.id },
    });
    expect(inscricoes).toBe(1);
  });

  it("inscreve uma vez só com aceites simultâneos", async () => {
    const { torneioId } = await seedTorneio(1);
    const convidado = await createUser("Convidado");

    const resultados = await Promise.allSettled(
      Array.from({ length: 5 }, () => acceptConvite({ userId: convidado.id }, torneioId)),
    );

    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.participante.count({ where: { torneioId, userId: convidado.id } })).toBe(1);
  });

  it("recusa um id que não existe sem gravar nada", async () => {
    const convidado = await createUser("Convidado");

    await expect(acceptConvite({ userId: convidado.id }, "nao-e-uuid")).rejects.toBeInstanceOf(NotFoundError);

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

    for (const torneioId of torneios.slice(0, 5)) {
      await acceptConvite({ userId: convidado.id }, torneioId);
    }
    await expect(acceptConvite({ userId: convidado.id }, torneios[5])).rejects.toBeInstanceOf(RuleViolationError);

    const inscritos = await prisma.participante.findMany({
      where: { userId: convidado.id },
      select: { torneioId: true },
    });
    expect(inscritos).toHaveLength(5);
    expect(inscritos.map((i) => i.torneioId)).not.toContain(torneios[5]);
  });

  it("torneios finalizados e os criados pela pessoa não contam no limite", async () => {
    const criadores = await createUsers(6, "Criador");
    const convidado = await createUser("Convidado");
    const torneios: string[] = [];
    for (const criador of criadores) {
      const criado = await criarTorneio(criador);
      torneios.push(criado.json?.id as string);
    }
    await criarTorneio(convidado, "Torneio do convidado");
    for (const torneioId of torneios.slice(0, 5)) {
      await acceptConvite({ userId: convidado.id }, torneioId);
    }
    await prisma.torneio.update({ where: { id: torneios[0] }, data: { finalizado: true } });

    await acceptConvite({ userId: convidado.id }, torneios[5]);

    expect(await prisma.participante.count({ where: { userId: convidado.id, torneioId: torneios[5] } })).toBe(1);
  });

  it("devolve as conquistas desbloqueadas ao entrar", async () => {
    const { torneioId } = await seedTorneio(1);
    const convidado = await createUser("Convidado");

    const conquistas = await acceptConvite({ userId: convidado.id }, torneioId);

    const gravadas = await prisma.userAchievement.findMany({
      where: { userId: convidado.id },
      select: { achievementId: true },
    });
    expect(conquistas.length).toBeGreaterThan(0);
    expect(conquistas.map((c) => c.id).sort()).toEqual(gravadas.map((g) => g.achievementId).sort());
  });
});
