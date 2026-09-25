"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";


export function DeleteAccountClient() {
  const router = useRouter();

  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!isChecked) {
    alert(
      "Você precisa marcar a opção de confirmação antes de excluir sua conta."
    );
    return;
  }

  setIsLoading(true);

  try {
    const { error } = await authClient.deleteUser({
    });

    if (error) {
      alert(error.message || "Erro ao excluir conta.");
      setIsLoading(false);
      return;
    }

    alert("Sua conta foi excluída com sucesso.");
    window.location.href = "/login";
  } catch (err) {
    console.error(err);
    alert("Erro inesperado ao excluir conta.");
  } finally {
    setIsLoading(false);
  }
}


  return (
    <div className=" text-white">
      <header className="px-4 pt-6 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center text-base mb-4"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </button>
      </header>

      <main className="flex-1 px-5 pb-6 space-y-4">
        <div className="mt-1">
          <h1 className="text-2xl font-bold">Apagar Conta</h1>
          <p className="mt-2 text-base font-semibold text-[#FFE47A]">
            Informações Importantes
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 text-[11px] leading-relaxed"
        >
          <section className="space-y-2">
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

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsChecked((prev) => !prev)}
              className={`
                self-start flex items-center justify-center
                w-4 h-4 rounded-[3px] border
                ${
                  isChecked
                    ? "bg-[#6BAAFD] border-[#6BAAFD]"
                    : "bg-transparent border-white"
                }
                `}
            >
              {isChecked && (
                <span className="block w-2 h-2 bg-white rounded-[2px]" />
              )}
            </button>

            <p className="text-[11px] text-white/85">
              Confirmo que li, estou de acordo com as informações acima e
              entendo que a exclusão da minha conta é definitiva e não poderá
              ser desfeita.
            </p>
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              disabled={!isChecked || isLoading}
              className="w-full rounded-sm bg-[#F87171] hover:bg-[#DC2626] text-white text-xs font-bold py-3 border-b-4 border-[#B91C1C] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Excluindo..." : "Excluir Conta"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
