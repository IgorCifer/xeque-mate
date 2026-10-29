import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { SettingsMenu } from "@/features/conta/components/settings-menu";

export default async function UserSettingsPage() {
  await requireSession();

  return (
    <div className="text-white">
      <header className="px-5 pt-6 pb-3">
        <Link href="/profile" className="mb-4 flex items-center text-base">
          <ChevronLeft className="mr-1 size-5" />
          Voltar
        </Link>
      </header>

      <div className="px-5 pb-2">
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <main className="flex-1 px-4 pt-4 pb-24 md:max-w-md">
        <SettingsMenu />
      </main>
    </div>
  );
}
