import { POST as checkLoginRoute } from "@/app/api/achievements/check-login/route";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { callRoute } from "../http";
import type { TestUser } from "../users";

export async function registrarDiaDeUso(user: TestUser | undefined) {
  return callRoute(checkLoginRoute, {
    method: "POST",
    path: "/api/achievements/check-login",
    user,
  });
}

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
