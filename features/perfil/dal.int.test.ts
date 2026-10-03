import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { createUser } from "@/test/integration/users";
import { getProfile, updateProfile } from "./dal";

describe("perfil", () => {
  it("devolve só o nome de quem está agindo", async () => {
    const jogador = await createUser("Ana Souza");

    expect(await getProfile({ userId: jogador.id })).toEqual({ name: "Ana Souza" });
  });

  it("muda o nome só de quem está agindo", async () => {
    const jogador = await createUser("Ana Souza");
    const outro = await createUser("Bruno Lima");

    await updateProfile({ userId: jogador.id }, { name: "Ana S." });

    const nomes = await prisma.user.findMany({
      where: { id: { in: [jogador.id, outro.id] } },
      select: { id: true, name: true },
    });
    expect(nomes).toEqual(
      expect.arrayContaining([
        { id: jogador.id, name: "Ana S." },
        { id: outro.id, name: "Bruno Lima" },
      ]),
    );
  });

  it("recusa um actor que não existe mais", async () => {
    const actor = { userId: "usuario-removido" };

    await expect(getProfile(actor)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateProfile(actor, { name: "Fantasma" })).rejects.toBeInstanceOf(NotFoundError);
  });
});
