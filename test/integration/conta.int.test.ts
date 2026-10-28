import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { createUser } from "./users";
import { excluirConta } from "./ops/conta";
import { seedTorneio } from "./ops/torneios";

describe("exclusão de conta", () => {
  it("exige a senha correta", async () => {
    const jogador = await createUser();

    expect((await excluirConta(jogador)).ok).toBe(false);
    expect((await excluirConta(jogador, "senha-errada")).ok).toBe(false);

    expect(await prisma.user.count({ where: { id: jogador.id } })).toBe(1);
  });

  it("com a senha, apaga a conta e o que ela criou", async () => {
    const { criador, torneioId } = await seedTorneio(2);

    expect((await excluirConta(criador, criador.password)).ok).toBe(true);

    expect(await prisma.user.count({ where: { id: criador.id } })).toBe(0);
    expect(await prisma.torneio.count({ where: { id: torneioId } })).toBe(0);
  });
});
