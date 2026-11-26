import type { ConviteDTO } from "../types";
import { AceitarConviteForm } from "./aceitar-convite-form";

export function ConviteCard({ convite }: { convite: ConviteDTO }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-white/20 bg-white/10 p-8 text-center text-white backdrop-blur-lg">
        <h1 className="mb-2 text-2xl font-bold">Convite para torneio</h1>
        <p className="opacity-80">{convite.nome}</p>

        <span className="inline-block rounded-full border border-gray-400/40 bg-gray-500/20 px-2 py-0.5 text-[11px] text-gray-100">
          Esperando confrontos
        </span>

        <p className="mt-4 text-sm opacity-75">
          Data: {convite.data.toLocaleDateString("pt-BR")}
        </p>

        <AceitarConviteForm torneioId={convite.id} />
      </div>
    </main>
  );
}
