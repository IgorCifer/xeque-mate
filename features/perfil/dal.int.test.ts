import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { NotFoundError, RuleViolationError } from "@/lib/errors";
import { createUser } from "@/test/integration/users";
import { getAvatar, getPoints, getProfile, removeAvatar, updateAvatar, updateProfile } from "./dal";

const jpeg = (size = 64) => {
  const data = new Uint8Array(size);
  data.set([0xff, 0xd8, 0xff, 0xe0]);
  return data;
};

describe("perfil", () => {
  it("devolve só o nome de quem está agindo", async () => {
    const jogador = await createUser("Ana Souza");

    expect(await getProfile({ userId: jogador.id })).toEqual({ name: "Ana Souza", image: null });
  });

  it("devolve os pontos de quem está agindo", async () => {
    const jogador = await createUser("Ana Souza");
    const outro = await createUser("Bruno Lima");
    await prisma.user.update({ where: { id: jogador.id }, data: { points: 42 } });
    await prisma.user.update({ where: { id: outro.id }, data: { points: 7 } });

    expect(await getPoints({ userId: jogador.id })).toBe(42);
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
    await expect(getPoints(actor)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateProfile(actor, { name: "Fantasma" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateAvatar(actor, jpeg())).rejects.toBeInstanceOf(NotFoundError);
    await expect(removeAvatar(actor)).rejects.toBeInstanceOf(NotFoundError);
    expect(await prisma.userAvatar.count()).toBe(0);
  });
});

describe("foto de perfil", () => {
  it("salva a foto e aponta o User.image para ela", async () => {
    const jogador = await createUser("Ana Souza");
    const actor = { userId: jogador.id };

    const image = await updateAvatar(actor, jpeg());

    expect(image.startsWith(`/api/avatar/${jogador.id}?v=`)).toBe(true);
    expect(image).toMatch(/\?v=\d+$/);
    expect((await getProfile(actor)).image).toBe(image);
    expect(await getAvatar(actor, jogador.id)).toEqual({ data: jpeg(), contentType: "image/jpeg" });
  });

  it("trocar a foto substitui a anterior e muda a versão da URL", async () => {
    const jogador = await createUser("Ana Souza");
    const actor = { userId: jogador.id };
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);

    const primeira = await updateAvatar(actor, jpeg());
    await new Promise((resolve) => setTimeout(resolve, 5));
    const segunda = await updateAvatar(actor, png);

    expect(segunda).not.toBe(primeira);
    expect(await prisma.userAvatar.count({ where: { userId: jogador.id } })).toBe(1);
    expect(await getAvatar(actor, jogador.id)).toEqual({ data: png, contentType: "image/png" });
  });

  it("qualquer pessoa logada vê a foto de outra", async () => {
    const dona = await createUser("Ana Souza");
    const outro = await createUser("Bruno Lima");
    await updateAvatar({ userId: dona.id }, jpeg());

    expect(await getAvatar({ userId: outro.id }, dona.id)).toMatchObject({ contentType: "image/jpeg" });
    expect(await getAvatar({ userId: dona.id }, outro.id)).toBeNull();
  });

  it("recusa formato desconhecido e arquivo acima de 300 KB sem gravar nada", async () => {
    const jogador = await createUser("Ana Souza");
    const actor = { userId: jogador.id };
    const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>");

    await expect(updateAvatar(actor, svg)).rejects.toBeInstanceOf(RuleViolationError);
    await expect(updateAvatar(actor, jpeg(300 * 1024 + 1))).rejects.toBeInstanceOf(RuleViolationError);

    expect(await prisma.userAvatar.count()).toBe(0);
    expect((await getProfile(actor)).image).toBeNull();
  });

  it("remover apaga a foto só de quem está agindo", async () => {
    const jogador = await createUser("Ana Souza");
    const outro = await createUser("Bruno Lima");
    await updateAvatar({ userId: jogador.id }, jpeg());
    const imagemDoOutro = await updateAvatar({ userId: outro.id }, jpeg());

    await removeAvatar({ userId: jogador.id });

    expect((await getProfile({ userId: jogador.id })).image).toBeNull();
    expect(await getAvatar({ userId: jogador.id }, jogador.id)).toBeNull();
    expect((await getProfile({ userId: outro.id })).image).toBe(imagemDoOutro);
  });

  it("excluir a conta leva a foto junto", async () => {
    const jogador = await createUser("Ana Souza");
    await updateAvatar({ userId: jogador.id }, jpeg());

    await prisma.user.delete({ where: { id: jogador.id } });

    expect(await prisma.userAvatar.count()).toBe(0);
  });
});
