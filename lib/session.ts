import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NEXT_PATH_HEADER, authPagePath } from "@/lib/next-path";

export type Actor = {
  userId: string;
};

export const requireSession = cache(async () => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect(authPagePath("/login", requestHeaders.get(NEXT_PATH_HEADER)));
  return session;
});

export async function requireActor(): Promise<Actor> {
  const session = await requireSession();
  return { userId: session.user.id };
}
