"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useConfirm } from "@/components/confirm-provider";


export function DeleteAccountClient() {
  const router = useRouter();
  const confirm = useConfirm();

  const [isChecked, setIsChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!isChecked) {
    toast.error(
      "Você precisa marcar a opção de confirmação antes de excluir sua conta."
    );
    return;
  }

  if (!password) {
    toast.error("Digite sua senha para confirmar a exclusão.");
    return;
  }

  const confirmed = await confirm({
    title: "Excluir sua conta?",
    description:
      "Seu progresso, conquistas, pontos e histórico serão apagados. Essa ação não pode ser desfeita.",
    confirmLabel: "Excluir conta",
    destructive: true,
  });
  if (!confirmed) return;

  setIsLoading(true);

  try {
    const { error } = await authClient.deleteUser({ password });

    if (error) {
      toast.error(error.message || "Erro ao excluir conta.");
      setIsLoading(false);
      return;
    }

    toast.success("Sua conta foi excluída com sucesso.");
    router.replace("/login");
  } catch (err) {
    console.error(err);
    toast.error("Erro inesperado ao excluir conta.");
  } finally {
    setIsLoading(false);
  }
}


  return (
    <div className="text-white">
      <header className="px-4 pt-6 pb-4">
        <Link href="/userSettings" className="flex items-center text-base mb-4">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </Link>
      </header>

      <main className="flex-1 px-5 pb-6 space-y-4">
        <div className="mt-1">
          <h1 className="text-2xl font-bold">Apagar Conta</h1>
          <p className="mt-2 text-base font-semibold text-warning">
            Informações Importantes
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 text-sm leading-relaxed"
        >
          <section className="space-y-3">
            <div>
              <p className="font-semibold">
                1. O que significa excluir sua conta no Clube Xeque Mate?
              </p>
              <p className="text-white/80 mt-1">
                Ao excluir sua conta, todo o seu progresso, histórico de
                partidas, conquistas, pontos e estatísticas serão removidos de
                forma permanente. Essa ação não pode ser desfeita e não será
                possível recuperar seus dados futuramente.
              </p>
            </div>

            <div>
              <p className="font-semibold mt-3">
                2. Antes de excluir sua conta, verifique:
              </p>
              <p className="text-white/80 mt-1">
                • Se você realmente não deseja mais utilizar o Clube Xeque Mate.
                <br />
                • Se não há torneios em andamento ou pendências relacionadas à
                sua conta.
                <br />• Se você salvou qualquer informação importante que
                gostaria de manter.
              </p>
            </div>

            <div>
              <p className="font-semibold mt-3">3. Para a sua segurança:</p>
              <p className="text-white/80 mt-1">
                A exclusão da conta é uma medida definitiva e feita pensando na
                sua privacidade. Caso queira voltar a utilizar a plataforma no
                futuro, será necessário criar uma nova conta e começar novamente
                seu progresso dentro do clube.
              </p>
            </div>
          </section>

          <label className="mt-2 flex items-start gap-3 cursor-pointer">
            <button
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              onClick={() => setIsChecked((prev) => !prev)}
              className={`
                mt-0.5 flex shrink-0 items-center justify-center
                size-5 rounded-[4px] border-2
                ${
                  isChecked
                    ? "bg-brand-400 border-brand-400"
                    : "bg-transparent border-white"
                }
                `}
            >
              {isChecked && (
                <span className="block size-2.5 bg-white rounded-[2px]" />
              )}
            </button>

            <span className="text-white/85">
              Confirmo que li, estou de acordo com as informações acima e
              entendo que a exclusão da minha conta é definitiva e não poderá
              ser desfeita.
            </span>
          </label>

          <input
            type="password"
            placeholder="Digite sua senha para confirmar"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full mt-2 p-3 bg-surface border border-neutral-400 rounded-lg focus:outline-none focus:ring-1 text-sm text-black"
          />

          <div className="mt-6">
            <Button
              type="submit"
              disabled={!isChecked || !password || isLoading}
              className="w-full rounded-sm bg-danger-300 hover:bg-danger-700 text-white text-sm font-bold py-3 border-b-4 border-danger-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Excluindo..." : "Excluir Conta"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
