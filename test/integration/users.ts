import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";

export type TestUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  cookie: string;
};

export async function createUser(name = "Jogador"): Promise<TestUser> {
  const email = `${randomUUID()}@teste.local`;
  const password = "senha-de-teste-123";
  const { headers, response } = await auth.api.signUpEmail({
    body: { name, email, password },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return { id: response.user.id, name, email, password, cookie };
}

export async function createUsers(count: number, prefix = "Jogador") {
  const users: TestUser[] = [];
  for (let i = 1; i <= count; i += 1) {
    users.push(await createUser(`${prefix} ${i}`));
  }
  return users;
}
