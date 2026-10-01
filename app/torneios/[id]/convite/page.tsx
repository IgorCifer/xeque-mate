"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAchievements } from "@/components/achievement-provider";

type TorneioConvite = {
  id: string;
  nome: string;
  data: string;
  finalizado?: boolean;
  _count?: { partidas?: number };
};

type ErrorPanelProps = {
  title: string;
  message: string;
  onBack: () => void;
  onDismiss: () => void;
};

function ErrorPanel({ title, message, onBack, onDismiss }: ErrorPanelProps) {
  return (
    <div className="w-full max-w-xl bg-gradient-to-br from-alert-900 via-alert-700 to-alert-950 border border-danger-300/40 rounded-2xl p-6 text-white shadow-lg backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-300/20 border border-danger-300/60 text-alert-200 text-lg font-bold">
          !
        </div>
        <div className="flex-1">
          <p className="text-sm uppercase tracking-wide text-alert-200/80 font-semibold">Alerta</p>
          <h2 className="text-lg font-semibold text-white mt-1">{title}</h2>
          <p className="text-sm text-alert-50 mt-1 leading-relaxed">{message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold"
            >
              Voltar para torneios
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 rounded-lg bg-danger-300 hover:bg-danger-500 text-sm font-semibold border border-danger-300/60"
            >
              Fechar aviso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConvitePage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [torneio, setTorneio] = useState<TorneioConvite | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const { showAchievement } = useAchievements();

  const voltarParaTorneios = () => router.push("/torneios");
  const fecharAviso = () => {
    setActionError("");
    setError("");
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/torneios/${id}/convite`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setTorneio(data.torneio);
        }
      } catch {
        setError("Erro ao carregar convite");
      }
      setLoading(false);
    }

    load();
  }, [id]);

  const temConfrontos = (torneio?._count?.partidas ?? 0) > 0;
  const status = torneio
    ? torneio.finalizado
      ? {
        label: "Finalizado",
        className:
          "inline-block text-[11px] px-2 py-0.5 rounded-full bg-success-100 text-success-700 border border-success-200",
      }
      : temConfrontos
        ? {
          label: "Em disputa",
          className:
            "inline-block text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-100 border border-blue-400/50",
        }
        : {
          label: "Esperando confrontos",
          className:
            "inline-block text-[11px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-100 border border-gray-400/40",
        }
    : null;

  async function aceitarConvite() {
    if (!torneio) return;
    if (torneio.finalizado) {
      setActionError("Não é possível entrar em torneio finalizado.");
      return;
    }
    if (temConfrontos) {
      setActionError("Confrontos já gerados. Não é possível entrar.");
      return;
    }

    const res = await fetch(`/api/torneios/${id}/convite`, {
      method: "POST",
    });

    const json = await res.json();

    if (json.error) {
      setActionError(json.error);
      return;
    }

    if (Array.isArray(json.unlockedAchievements)) {
      json.unlockedAchievements.forEach(showAchievement);
    }

    alert("Você entrou no torneio!");
    router.push("/torneios");
  }

  if (loading)
    return <div className="text-white p-10">Carregando...</div>;

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <ErrorPanel
          title="Não foi possível acessar o convite"
          message={error}
          onBack={voltarParaTorneios}
          onDismiss={fecharAviso}
        />
      </main>
    );
  }

  if (!torneio) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <ErrorPanel
          title="Convite não disponível"
          message="Este convite pode ter expirado ou sido removido."
          onBack={voltarParaTorneios}
          onDismiss={fecharAviso}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-white/10 border border-white/20 p-8 rounded-xl text-white w-[90%] max-w-md text-center backdrop-blur-lg space-y-4">
        <h1 className="text-2xl font-bold mb-2">Convite para torneio</h1>
        <p className="opacity-80">{torneio.nome}</p>

        {status ? <span className={status.className}>{status.label}</span> : null}

        <p className="mt-4 text-sm opacity-75">
          Data: {new Date(torneio.data).toLocaleDateString("pt-BR")}
        </p>

        {actionError && (
          <div className="text-left bg-alert-900/80 border border-danger-300/40 text-alert-50 rounded-xl p-4 shadow-inner">
            <p className="text-sm font-semibold text-alert-200">Não foi possível continuar</p>
            <p className="text-sm leading-relaxed mt-1">{actionError}</p>
            <button
              className="mt-3 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold"
              onClick={() => setActionError("")}
            >
              Fechar
            </button>
          </div>
        )}

        <button
          onClick={aceitarConvite}
          className="mt-6 w-full bg-success-400 hover:bg-success-500 border border-success-500 px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!torneio || temConfrontos || torneio.finalizado}
        >
          Aceitar convite
        </button>

        <button
          onClick={() => router.push("/torneios")}
          className="mt-3 w-full bg-danger-400 hover:bg-danger-600 border border-danger-600 px-4 py-2 rounded-lg font-semibold text-white"
        >
          Recusar convite
        </button>
      </div>
    </main>
  );
}
