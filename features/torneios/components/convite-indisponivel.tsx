import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ConviteIndisponivel({ motivo }: { motivo: string }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div
        role="alert"
        className="w-full max-w-xl rounded-2xl border border-danger-300/40 bg-linear-to-br from-alert-900 via-alert-700 to-alert-950 p-6 text-white shadow-lg backdrop-blur-md"
      >
        <div className="flex items-start gap-3">
          <div
            aria-hidden
            className="flex size-10 items-center justify-center rounded-full border border-danger-300/60 bg-danger-300/20 text-lg font-bold text-alert-200"
          >
            !
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-alert-200/80">Alerta</p>
            <h1 className="mt-1 text-lg font-semibold">Não foi possível acessar o convite</h1>
            <p className="mt-1 text-sm leading-relaxed text-alert-50">{motivo}</p>
            <Button
              asChild
              variant="outline"
              className="mt-4 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/torneios">Voltar para torneios</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
