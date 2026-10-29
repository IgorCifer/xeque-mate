import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/lib/session";
import { ChangePasswordForm } from "@/features/conta/components/change-password-form";

export default async function ChangePasswordPage() {
  await requireSession();

  return (
    <div className="text-white">
      <header className="px-5 pt-6 pb-3">
        <Link href="/userSettings" className="mb-4 flex items-center text-base">
          <ChevronLeft className="mr-1 size-5" />
          Voltar
        </Link>
      </header>

      <main className="flex-1 px-5 pb-6">
        <div className="mt-1 mb-4">
          <h1 className="text-2xl font-bold">Alterar Senha</h1>
          <p className="mt-2 text-base text-white/80">
            Preencha os campos abaixo para atualizar sua senha.
          </p>
        </div>

        <Card className="mt-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md md:max-w-md">
          <CardContent className="px-4 py-5">
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
