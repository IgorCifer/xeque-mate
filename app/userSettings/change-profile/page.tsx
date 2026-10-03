import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireActor } from "@/lib/session";
import { getProfile } from "@/features/perfil/dal";
import { ProfileForm } from "@/features/perfil/components/profile-form";

export default async function ChangeProfilePage() {
  const actor = await requireActor();
  const profile = await getProfile(actor);

  return (
    <div className="text-white">
      <header className="pt-6 px-5 pb-3">
        <Link href="/userSettings" className="flex items-center text-base mb-4">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </Link>
      </header>

      <main className="flex-1 px-5 pb-6">
        <div className="mt-1 mb-4">
          <h1 className="text-2xl font-bold">Alterar Perfil</h1>
          <p className="mt-2 text-base text-white/80">
            Altere o nome que aparece no seu perfil, nos torneios e no ranking.
          </p>
        </div>

        <Card className="mt-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md md:max-w-md">
          <CardContent className="px-4 py-6">
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
