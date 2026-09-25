"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface UserMini {
  id?: string | null;
}

interface Torneio {
  id: string;
  nome: string;
  data: string;
  modo: string;
  criadorId?: string;
  finalizado?: boolean;
  _count?: { partidas?: number };
  participantes?: { id: string; user?: UserMini }[];
}

interface ConfirmState {
  open: boolean;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
}

export default function TorneiosPage() {
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [participando, setParticipando] = useState<Torneio[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({
    open: false,
    message: "",
    confirmLabel: undefined,
    onConfirm: async () => {},
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [resCriados, resParticipando, resUser] = await Promise.all([
          fetch("/api/torneios", { cache: "no-store" }),
          fetch("/api/torneios/participando", { cache: "no-store" }),
          fetch("/api/user", { cache: "no-store" }),
        ]);

        const [jsonCriados, jsonParticipando, jsonUser] = await Promise.all([
          resCriados.json().catch(() => ({})),
          resParticipando.json().catch(() => ({})),
          resUser.json().catch(() => ({})),
        ]);

        if (resCriados.ok && Array.isArray(jsonCriados)) {
          setTorneios(jsonCriados);
        } else if (jsonCriados?.error) {
          alert(jsonCriados.error);
        }

        if (resParticipando.ok && Array.isArray(jsonParticipando)) {
          setParticipando(jsonParticipando);
        } else if (jsonParticipando?.error) {
          alert(jsonParticipando.error);
        }

        if (resUser.ok && jsonUser?.id) {
          setUserId(jsonUser.id as string);
        }
      } catch (error) {
        console.error("Erro ao carregar torneios:", error);
        alert("Erro ao carregar torneios");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const modeImage = (modo: string) => {
    const map: Record<string, string> = {
      Classic: "/black-pawn.png",
      "Clássico": "/black-pawn.png",
      Bullet: "/black-knight.png",
      Blitz: "/black-bishop.png",
      Rapid: "/black-rook.png",
      "Rápido": "/black-rook.png",
    };
    return map[modo] ?? "/chess.png";
  };

  const statusInfo = (t: Torneio) => {
    const temConfrontos = (t._count?.partidas ?? 0) > 0;
    if (t.finalizado) {
      return {
        label: "Finalizado",
        className:
          "inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-[#D9F4EA] text-[#1E8F63] border border-[#A4E2C7]",
      };
    }
    if (temConfrontos) {
      return {
        label: "Em disputa",
        className:
          "inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-100 border border-blue-400/50",
      };
    }
    return {
      label: "Esperando confrontos",
      className:
        "inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-100 border border-gray-400/40",
    };
  };

  const abrirConfirmacao = (
    message: string,
    onConfirm: () => Promise<void> | void,
    confirmLabel?: string
  ) => {
    setConfirmModal({ open: true, message, onConfirm, confirmLabel });
  };

  const excluirTorneio = async (id: string) => {
    try {
      const res = await fetch(`/api/torneios/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        alert(json.error ?? "Erro ao excluir torneio");
        return;
      }
      setTorneios((prev) => prev.filter((item) => item.id !== id));
      setParticipando((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir torneio");
    }
  };

  const sairDoTorneio = async (t: Torneio) => {
    if (!userId) {
      alert("Não foi possível identificar o usuário.");
      return;
    }

    const participante = t.participantes?.find(
      (p) => p.user?.id === userId || p.id === userId
    );
    if (!participante) {
      alert("Participação não encontrada para este torneio.");
      return;
    }

    if ((t._count?.partidas ?? 0) > 0 && !t.finalizado) {
      alert("Não é possível sair com confrontos gerados. Aguarde excluir confrontos ou finalizar.");
      return;
    }

    try {
      const res = await fetch(`/api/torneios/${t.id}/participantes/${participante.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        alert(json.error ?? "Erro ao sair do torneio");
        return;
      }

      setParticipando((prev) => prev.filter((item) => item.id !== t.id));
      alert(t.finalizado ? "Torneio removido da sua lista" : "Você saiu do torneio");
    } catch (err) {
      console.error(err);
      alert("Erro ao sair do torneio");
    }
  };

  if (loading) {
    return <p className="text-white p-5">Carregando...</p>;
  }

  const atingiuLimiteCriados = torneios.length >= 5;

  return (
    <main className="min-h-screen text-white p-5 flex flex-col gap-6">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Torneios</h1>

        <div className="flex flex-col items-end gap-1 text-sm opacity-80">
          <span>{torneios.length}/5 Torneios criados</span>
          <span>{participando.length}/5 Torneios em disputa</span>
        </div>
      </header>

      {/* CARD DE CRIAR TORNEIO */}
      <section className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="flex items-center gap-3">
          <img src="/black-king.png" className="w-14 h-14" alt="imagem" />
          <div>
            <h2 className="text-lg font-semibold">Criação de Torneios</h2>
            <p className="text-sm opacity-80">Crie um torneio com suas configurações.</p>
          </div>
        </div>

        <div className="flex-1" />

        <Link
          href={atingiuLimiteCriados ? "#" : "/torneios/novo"}
          onClick={(e) => {
            if (atingiuLimiteCriados) {
              e.preventDefault();
              alert("Limite de 5 torneios atingido. Exclua um para criar outro.");
            }
          }}
          className="w-full sm:w-auto text-center bg-[#6BAAFD] hover:bg-[#5C9CF0] transition px-4 py-3 rounded-lg text-white font-medium border border-[#5C9CF0]"
        >
          Criar Torneio
        </Link>
      </section>

      {/* LISTA DE TORNEIOS CRIADOS */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold mb-2">Torneios Criados</h2>
        {torneios.length === 0 ? (
          <p className="text-center opacity-60">Nenhum torneio criado ainda</p>
        ) : (
          torneios.map((t) => (
            <article
              key={t.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5"
            >
              <img src={modeImage(t.modo)} className="w-10 h-10 mx-auto sm:mx-0" alt={t.modo} />

              <div className="flex-1 flex flex-col gap-1 items-center text-center sm:items-start sm:text-left">
                <h3 className="text-lg font-semibold leading-tight break-words">{t.nome}</h3>
                <p className="text-sm opacity-80">
                  Modo: <span className="font-semibold">{t.modo}</span>
                </p>
                <p className="text-xs opacity-60">
                  {new Date(t.data).toLocaleDateString("pt-BR")}
                </p>
                {(() => {
                  const status = statusInfo(t);
                  return <span className={`${status.className} self-center sm:self-start mt-1`}>{status.label}</span>;
                })()}
              </div>

              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:justify-end sm:items-center">
                <Link
                  href={`/torneios/${t.id}`}
                  className="w-full sm:w-auto text-center bg-[#4CCB8A] hover:bg-[#3FB479] border border-[#3FB479] px-4 py-2 rounded-lg text-sm font-semibold text-white"
                >
                  Acessar
                </Link>

                <Link
                  href={`/torneios/${t.id}/editar`}
                  className="w-full sm:w-auto text-center bg-[#6BAAFD] hover:bg-[#5C9CF0] px-4 py-2 rounded-lg text-sm font-semibold text-white border border-[#5C9CF0]"
                >
                  Editar
                </Link>

                <button
                  onClick={() =>
                    abrirConfirmacao(
                      t.finalizado
                        ? "Tem certeza que deseja excluir este torneio finalizado?"
                        : "Tem certeza que deseja excluir este torneio?",
                      () => excluirTorneio(t.id),
                      t.finalizado ? "Excluir torneio" : "Excluir"
                    )
                  }
                  className="w-full sm:w-auto text-center bg-[#F37272] hover:bg-[#E05F5F] border border-[#E05F5F] px-4 py-2 rounded-lg text-sm font-semibold text-white"
                >
                  {t.finalizado ? "Excluir torneio" : "Excluir"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* LISTA DE TORNEIOS PARTICIPANDO */}
      <div className="flex flex-col gap-4 mt-8">
        <h2 className="text-lg font-bold mb-2">Torneios em disputa</h2>
        {participando.length === 0 ? (
          <p className="text-center opacity-60">Você não está participando de nenhum torneio</p>
        ) : (
          participando.map((t) => (
            <article
              key={t.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5"
            >
              <img src={modeImage(t.modo)} className="w-10 h-10 mx-auto sm:mx-0" alt={t.modo} />

              <div className="flex-1 flex flex-col gap-1 items-center text-center sm:items-start sm:text-left">
                <h3 className="text-lg font-semibold leading-tight break-words">{t.nome}</h3>
                <p className="text-sm opacity-80">
                  Modo: <span className="font-semibold">{t.modo}</span>
                </p>
                <p className="text-xs opacity-60">
                  {new Date(t.data).toLocaleDateString("pt-BR")}
                </p>
                {(() => {
                  const status = statusInfo(t);
                  return <span className={`${status.className} self-center sm:self-start mt-1`}>{status.label}</span>;
                })()}
              </div>

              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:justify-end sm:items-center">
                <Link
                  href={`/torneios/${t.id}`}
                  className="w-full sm:w-auto text-center bg-[#4CCB8A] hover:bg-[#3FB479] border border-[#3FB479] px-4 py-2 rounded-lg text-sm font-semibold text-white"
                >
                  Acessar
                </Link>
                {/* Sem editar/apagar/compartilhar para torneios apenas participando */}
                {t.criadorId !== userId && (
                  <button
                    onClick={() =>
                      abrirConfirmacao(
                        t.finalizado
                          ? "Tem certeza que deseja excluir este torneio da sua lista?"
                          : "Tem certeza que deseja sair deste torneio?",
                        () => sairDoTorneio(t),
                        t.finalizado ? "Excluir" : "Sair"
                      )
                    }
                    className="w-full sm:w-auto text-center bg-[#F37272] hover:bg-[#E05F5F] border border-[#E05F5F] px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={((t._count?.partidas ?? 0) > 0) && !t.finalizado}
                  >
                    {t.finalizado ? "Excluir torneio" : "Sair"}
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-slate-900 text-white w-full max-w-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Confirmação</h3>
              <button
                className="text-sm text-gray-300 hover:text-white"
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
              >
                Fechar
              </button>
            </div>
            <div className="p-4 text-sm text-gray-100 whitespace-pre-line">{confirmModal.message}</div>
            <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-3 bg-slate-900/60">
              <button
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm font-semibold"
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#F37272] hover:bg-[#E05F5F] text-sm font-semibold"
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  setConfirmModal((prev) => ({ ...prev, open: false }));
                  await fn();
                }}
              >
                {confirmModal.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
