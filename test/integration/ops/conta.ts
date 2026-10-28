import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import type { TestUser } from "../users";

export async function excluirConta(user: TestUser, password?: string) {
  try {
    await auth.api.deleteUser({
      body: password === undefined ? {} : { password },
      headers: new Headers({ cookie: user.cookie }),
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof APIError) return { ok: false as const, message: error.message };
    throw error;
  }
}
