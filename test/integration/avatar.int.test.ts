import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/avatar/[userId]/route";
import { updateAvatar } from "@/features/perfil/dal";
import { createUser, type TestUser } from "./users";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x01, 0x02, 0x03]);

async function fetchAvatar(userId: string, user?: TestUser) {
  const headers = new Headers();
  if (user) headers.set("cookie", user.cookie);
  return GET(new Request(`http://localhost:3000/api/avatar/${userId}`, { headers }), {
    params: Promise.resolve({ userId }),
  });
}

describe("rota da foto de perfil", () => {
  it("exige sessão", async () => {
    const dona = await createUser("Ana Souza");
    await updateAvatar({ userId: dona.id }, jpeg);

    expect((await fetchAvatar(dona.id)).status).toBe(401);
  });

  it("serve a foto de outra pessoa com o tipo certo e cache longo", async () => {
    const dona = await createUser("Ana Souza");
    const visitante = await createUser("Bruno Lima");
    await updateAvatar({ userId: dona.id }, jpeg);

    const res = await fetchAvatar(dona.id, visitante);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(jpeg);
  });

  it("responde 404 para quem não tem foto", async () => {
    const visitante = await createUser("Bruno Lima");

    expect((await fetchAvatar(visitante.id, visitante)).status).toBe(404);
    expect((await fetchAvatar("nao-existe", visitante)).status).toBe(404);
  });
});
