import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ChangeEmailClient } from "./components/change-email-form";
import { redirect } from "next/navigation";

export default async function ChangeEmailPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return <ChangeEmailClient />;
}
