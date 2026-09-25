import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SettingsClient } from "@/app/userSettings/components/settings-client";
import { redirect } from "next/navigation";

export default async function UserSettingsPage() {
const session = await auth.api.getSession({
headers: await headers(),
});


if (!session) {
    redirect("/login");
}

return <SettingsClient />;
}