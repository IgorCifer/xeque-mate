import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type Actor = {
  userId: string;
};

export const requireSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
});

export async function requireActor(): Promise<Actor> {
  const session = await requireSession();
  return { userId: session.user.id };
}
