import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Sessão do usuário logado para páginas e layouts (server components); sem
 * sessão, redireciona para /login. Rotas de API não usam isto: checam a
 * sessão por conta própria e respondem 401.
 */
export const requireSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
});
