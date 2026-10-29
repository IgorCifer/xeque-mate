import { requireSession } from "@/lib/session";
import { DeleteAccountClient } from "./components/delete-account-client";

export default async function DeleteAccountPage() {
  await requireSession();

  return <DeleteAccountClient />;
}
