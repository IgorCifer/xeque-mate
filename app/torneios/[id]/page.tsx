"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface UserMini {
  id?: string;
  name?: string | null;
  email?: string;
  image?: string | null;
}

interface Participante {
  id: string;
  user?: UserMini;
  pontos?: number;
  partidas?: number;
  vitorias?: number;
  derrotas?: number;
  empates?: number;
}

type Resultado = "WHITE_WIN" | "BLACK_WIN" | "DRAW" | null;

interface PartidaResumo {
  id: string;
  rodada: number;
  resultado: Resultado;
  white: Participante;
  black: Participante | null;
}

interface RodadaView {
  rodada: number;
  partidas: PartidaResumo[];
}

interface Torneio {
  id: string;
  nome: string;
  data: string;
  modo: string;
  finalizado?: boolean;
  descricao?: string | null;
  criadorId: string;
  participantes: Participante[];
  rodadas?: RodadaView[];
  ranking?: Participante[];
}

export default function TorneioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [atualizandoPartida, setAtualizandoPartida] = useState<string | null>(null);
  const [verTabela, setVerTabela] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmarFinalizar, setConfirmarFinalizar] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmRemocao, setConfirmRemocao] = useState<{ open: boolean; participanteId: string | null; nome?: string }>(
    { open: false, participanteId: null }
  );
  const modeImage = (m: string) => {
    const map: Record<string, string> = {
      Classic: "/black-pawn.png",
      "Clássico": "/black-pawn.png",
      Bullet: "/black-knight.png",
      Blitz: "/black-bishop.png",
      Rapid: "/black-rook.png",
      "Rápido": "/black-rook.png",
    };
    return map[m] ?? "/chess.png";
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/torneios/${id}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          alert(json.error ?? "Erro ao carregar torneio");
          router.push("/torneios");
          return;
        }

        if (json.error) {
          alert(json.error);
          router.push("/torneios");
          return;
        }

        setTorneio(json);
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar torneio");
        router.push("/torneios");
      } finally {
        setLoading(false);
      }
    }

    async function loadUser() {
      try {
        const res = await fetch("/api/user");
        const json = await res.json();
        if (json.id) setUserId(json.id);
      } catch { }
    }

    if (id) {
      load();
      loadUser();
    }
  }, [id, router]);

  const gerarConfrontos = async () => {
    if (!torneio || userId !== torneio.criadorId) return;
    const jaTemConfrontos = (torneio.rodadas?.length ?? 0) > 0;
    if (jaTemConfrontos) {
      alert("Exclua os confrontos atuais antes de gerar novos.");
      return;
    }
    const roundsInput = prompt("Quantas rodadas deseja gerar?", "1");
    if (roundsInput === null) return;
    const rounds = Number(roundsInput);
    if (!Number.isFinite(rounds) || rounds < 1) {
      alert("Número de rodadas inválido");
      return;
    }

    setGerando(true);
    try {
      const res = await fetch(`/api/torneios/${id}/rodadas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rounds }),
      });

      let json: { error?: string; success?: boolean } = {};
      try {
        const text = await res.text();
        json = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("Erro ao ler resposta de rodadas", err);
      }

      if (!res.ok || json.error) {
        alert(json.error ?? "Não foi possível gerar confrontos");
        return;
      }

      // Recarrega dados para refletir novas rodadas
      const reload = await fetch(`/api/torneios/${id}`, { cache: "no-store" });
      const reloadJson = await reload.json();
      if (!reload.ok || reloadJson.error) {
        alert(reloadJson.error ?? "Confrontos gerados, mas falhou ao recarregar");
      } else {
        setTorneio(reloadJson);
        alert("Confrontos gerados com sucesso");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar confrontos");
    } finally {
      setGerando(false);
    }
  };

  const excluirConfrontos = async () => {
    if (!torneio || userId !== torneio.criadorId) return;
    if (!confirm("Excluir todos os confrontos e zerar pontuações?")) return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/torneios/${id}/rodadas`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        alert(json.error ?? "Falha ao excluir confrontos");
        return;
      }

      const reload = await fetch(`/api/torneios/${id}`, { cache: "no-store" });
      const reloadJson = await reload.json();
      if (!reload.ok || reloadJson.error) {
        alert(reloadJson.error ?? "Confrontos excluídos, mas falhou ao recarregar");
      } else {
        setTorneio(reloadJson);
        alert("Confrontos excluídos e pontuações reiniciadas");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir confrontos");
    } finally {
      setExcluindo(false);
    }
  };

  const finalizarTorneio = async () => {
    if (!torneio || userId !== torneio.criadorId) return;
    setFinalizando(true);
    try {
      const res = await fetch(`/api/torneios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalizado: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        alert(json.error ?? "Falha ao finalizar torneio");
        return;
      }

      setTorneio((prev) => (prev ? { ...prev, finalizado: true } : prev));
      alert("Torneio finalizado");
      setConfirmarFinalizar(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar torneio");
    } finally {
      setFinalizando(false);
    }
  };

  const removerParticipante = async (participanteId: string) => {
    try {
      const res = await fetch(`/api/torneios/${id}/participantes/${participanteId}`, {
        method: "DELETE",
      });
      let json: { error?: string; success?: boolean } = {};
      try {
        const text = await res.text();
        json = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("Erro ao ler resposta de remoção", err);
      }

      if (!res.ok || json.error) {
        alert(json.error ?? "Erro ao remover participante");
        return false;
      }

      setTorneio((t) =>
        t
          ? {
            ...t,
            participantes: t.participantes.filter((p) => p.id !== participanteId),
          }
          : t
      );
      return true;
    } catch (err) {
      console.error(err);
      alert("Erro ao remover participante");
      return false;
    }
  };

  const atualizarResultado = async (partidaId: string, resultado: Resultado) => {
    if (!resultado) return;
    setAtualizandoPartida(partidaId);
    try {
      const res = await fetch(`/api/torneios/${id}/partidas/${partidaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultado }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        alert(json.error ?? "Falha ao salvar resultado");
        return;
      }

      // Recarrega para atualizar ranking e estatísticas
      const reload = await fetch(`/api/torneios/${id}`, { cache: "no-store" });
      const reloadJson = await reload.json();
      if (!reload.ok || reloadJson.error) {
        // fallback: apenas marca resultado localmente
        setTorneio((prev) => {
          if (!prev?.rodadas) return prev;
          const rodadas = prev.rodadas.map((r) => ({
            ...r,
            partidas: r.partidas.map((p) =>
              p.id === partidaId ? { ...p, resultado } : p
            ),
          }));
          return { ...prev, rodadas };
        });
        alert(reloadJson.error ?? "Resultado salvo, mas falhou ao atualizar tabela");
      } else {
        setTorneio(reloadJson);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar resultado");
    } finally {
      setAtualizandoPartida(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen text-white p-5 flex items-center justify-center">
        <p>Carregando...</p>
      </main>
    );
  }

  if (!torneio) {
    return (
      <main className="min-h-screen text-white p-5 flex items-center justify-center">
        <p>Torneio não encontrado</p>
      </main>
    );
  }

  const isCriador = userId === torneio.criadorId;
  const temConfrontos = (torneio.rodadas?.length ?? 0) > 0;
  const status = torneio.finalizado
    ? { label: "Finalizado", className: "bg-[#D9F4EA] text-[#1E8F63] border border-[#A4E2C7]" }
    : temConfrontos
      ? { label: "Em disputa", className: "bg-blue-600/20 border border-blue-400 text-blue-100" }
      : { label: "Esperando confrontos", className: "bg-gray-500/20 border border-gray-400 text-gray-100" };

  return (
    <main className="min-h-screen text-white p-5 flex flex-col gap-6">
      {/* HEADER COM BOTÕES */}
      <header className="flex items-center justify-between">
        {/* Botão Voltar */}
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-lg transition flex items-center gap-2"
          title="Voltar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">Voltar</span>
        </button>

        {/* Botão Compartilhar */}
        <button
          onClick={() => setShareOpen(true)}
          className="bg-[#6BAAFD] hover:bg-[#5C9CF0] transition px-4 py-2 rounded-lg font-semibold text-white border border-[#5C9CF0]"
          title="Compartilhar link do convite"
        >
          <span className="block">Compartilhar</span>
        </button>
      </header>

      {/* INFORMAÇÕES DO TORNEIO */}
      <section className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-1 text-center sm:text-left">
            <img
              src={modeImage(torneio.modo)}
              className="w-16 h-16 flex-shrink-0 mx-auto sm:mx-0"
              alt={torneio.modo}
            />

            <div className="flex-1 flex flex-col gap-2 items-center sm:items-start">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <h1 className="text-3xl font-bold leading-tight">{torneio.nome}</h1>
                <span className={`mt-2 sm:mt-0 self-center sm:self-center px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <div className="flex flex-col gap-2 text-sm opacity-80">
                <p>
                  <span className="font-semibold">Modo:</span> {torneio.modo}
                </p>
                <p>
                  <span className="font-semibold">Data:</span>{" "}
                  {new Date(torneio.data).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
                {torneio.descricao ? (
                  <p className="text-xs opacity-90">
                    <span className="font-semibold">Descrição:</span> {torneio.descricao}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTÕES DE AÇÃO */}
      <section className="flex flex-col sm:flex-row gap-3">
        {isCriador && (
          <button
            className="flex-1 bg-[#4CCB8A] hover:bg-[#3FB479] border border-[#3FB479] transition px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={gerando || torneio.finalizado || temConfrontos}
            onClick={gerarConfrontos}
          >
            {torneio.finalizado
              ? "Finalizado"
              : temConfrontos
                ? "Exclua confrontos para gerar"
                : gerando
                  ? "Gerando..."
                  : "Gerar Confrontos"}
          </button>
        )}

        <button
          className={`${isCriador ? "flex-1" : "w-full"} bg-[#6BAAFD] hover:bg-[#5C9CF0] transition px-6 py-3 rounded-lg font-semibold text-white border border-[#5C9CF0]`}
          onClick={() => setVerTabela(true)}
        >
          Ver Tabela
        </button>
      </section>

      {isCriador && (
        <section className="flex flex-col sm:flex-row gap-3">
          <button
            className="flex-1 bg-[#F37272] hover:bg-[#E05F5F] border border-[#E05F5F] transition px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-white"
            onClick={excluirConfrontos}
            disabled={excluindo || gerando || (torneio.rodadas?.length ?? 0) === 0}
          >
            {excluindo ? "Excluindo..." : "Excluir Confrontos"}
          </button>
          <button
            className="flex-1 bg-amber-500 hover:bg-amber-400 transition px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setConfirmarFinalizar(true)}
            disabled={torneio.finalizado || (torneio.rodadas?.length ?? 0) === 0}
          >
            {torneio.finalizado ? "Torneio Finalizado" : "Finalizar Torneio"}
          </button>
        </section>
      )}

      {/* RODADAS / CONFRONTOS */}
      {torneio.rodadas && torneio.rodadas.length > 0 && (
        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col gap-4">
          <h2 className="text-xl font-bold">Confrontos</h2>
          {torneio.rodadas.map((rodada) => (
            <div key={rodada.rodada} className="border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Rodada {rodada.rodada}</span>
              </div>
              <div className="flex flex-col gap-2">
                {rodada.partidas.map((partida) => {
                  const isBye = !partida.black;
                  const whiteName = partida.white.user?.name ?? "Brancas";
                  const blackName = partida.black?.user?.name ?? "Pretas";
                  const labelResultado = partida.resultado === "WHITE_WIN"
                    ? `Vitória: ${whiteName}`
                    : partida.resultado === "BLACK_WIN"
                      ? `Vitória: ${blackName}`
                      : partida.resultado === "DRAW"
                        ? "Empate"
                        : "Pendente";
                  return (
                    <div
                      key={partida.id}
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {partida.white.user?.name ?? "Brancas"}
                          {isBye ? " (bye)" : " vs " + (partida.black?.user?.name ?? "Pretas")}
                        </span>
                        <span className="text-xs text-gray-300">{labelResultado}</span>
                      </div>
                      {!isBye && userId === torneio.criadorId && (
                        <select
                          className="bg-slate-800 text-white border border-white/30 rounded px-2 py-1 text-sm"
                          value={partida.resultado ?? ""}
                          onChange={(e) =>
                            atualizarResultado(partida.id, e.target.value as Resultado)
                          }
                          disabled={atualizandoPartida === partida.id || torneio.finalizado}
                        >
                          <option className="bg-slate-800 text-white" value="">Definir resultado</option>
                          <option className="bg-slate-800 text-white" value="WHITE_WIN">Vitória: {whiteName}</option>
                          <option className="bg-slate-800 text-white" value="BLACK_WIN">Vitória: {blackName}</option>
                          <option className="bg-slate-800 text-white" value="DRAW">Empate</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* MODAL RANKING */}
      {verTabela && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-slate-900 text-white w-full max-w-3xl rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-lg font-semibold">Tabela de Pontuação</h3>
              <button
                className="text-sm text-gray-300 hover:text-white"
                onClick={() => setVerTabela(false)}
              >
                Fechar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800 text-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2">Nome</th>
                    <th className="text-center px-4 py-2">Pontos</th>
                    <th className="text-center px-4 py-2">Partidas Jogadas</th>
                    <th className="text-center px-4 py-2">Vitórias</th>
                    <th className="text-center px-4 py-2">Derrotas</th>
                    <th className="text-center px-4 py-2">Empates</th>
                  </tr>
                </thead>
                <tbody>
                  {(torneio.ranking ?? []).map((p) => (
                    <tr key={p.id} className="odd:bg-slate-900 even:bg-slate-800/40">
                      <td className="px-4 py-2 font-semibold">{p.user?.name ?? "Participante"}</td>
                      <td className="px-4 py-2 text-center">{p.pontos ?? 0}</td>
                      <td className="px-4 py-2 text-center">{p.partidas ?? 0}</td>
                      <td className="px-4 py-2 text-center">{p.vitorias ?? 0}</td>
                      <td className="px-4 py-2 text-center">{p.derrotas ?? 0}</td>
                      <td className="px-4 py-2 text-center">{p.empates ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPARTILHAR */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-slate-900 text-white w-full max-w-lg rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-lg font-semibold">Link de convite</h3>
              <button
                className="text-sm text-gray-300 hover:text-white"
                onClick={() => setShareOpen(false)}
              >
                Fechar
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-sm text-gray-200">Compartilhe este link para convidar jogadores:</p>
              {(() => {
                const conviteLink = `http://192.168.0.7:3000/torneios/${id}/convite`;
                const copyLink = async () => {
                  const copyWithExecCommand = () => {
                    const textarea = document.createElement("textarea");
                    textarea.value = conviteLink;
                    textarea.style.position = "fixed";
                    textarea.style.left = "-9999px";
                    document.body.appendChild(textarea);
                    textarea.select();
                    textarea.setSelectionRange(0, textarea.value.length);
                    const success = document.execCommand("copy");
                    document.body.removeChild(textarea);
                    return success;
                  };

                  try {
                    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText && window.isSecureContext) {
                      await navigator.clipboard.writeText(conviteLink);
                      alert("Link copiado para a área de transferência!");
                      return;
                    }

                    const ok = copyWithExecCommand();
                    if (ok) {
                      alert("Link copiado para a área de transferência!");
                      return;
                    }

                    window.prompt("Copie o link:", conviteLink);
                  } catch (err) {
                    console.error("Falha ao copiar link", err);
                    const ok = copyWithExecCommand();
                    if (ok) {
                      alert("Link copiado para a área de transferência!");
                    } else {
                      window.prompt("Copie o link:", conviteLink);
                    }
                  }
                };
                return (
                  <>
                    <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm break-all">{conviteLink}</div>
                    <button
                      onClick={copyLink}
                      className="self-start bg-[#6BAAFD] hover:bg-[#5C9CF0] border border-[#5C9CF0] text-white text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                      Copiar link
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {confirmRemocao.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-slate-900 text-white w-full max-w-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-lg font-semibold">Confirmar remoção</h3>
              <button
                className="text-sm text-gray-300 hover:text-white"
                onClick={() => setConfirmRemocao({ open: false, participanteId: null })}
              >
                Fechar
              </button>
            </div>
            <div className="p-4 text-sm text-gray-100">
              Tem certeza que deseja remover {confirmRemocao.nome ?? "o participante"}?
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-3 bg-slate-900/60">
              <button
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm font-semibold"
                onClick={() => setConfirmRemocao({ open: false, participanteId: null })}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#F37272] hover:bg-[#E05F5F] text-sm font-semibold"
                onClick={async () => {
                  const id = confirmRemocao.participanteId;
                  setConfirmRemocao({ open: false, participanteId: null });
                  if (id) {
                    await removerParticipante(id);
                  }
                }}
                disabled={torneio.finalizado}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarFinalizar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-slate-900 text-white w-full max-w-3xl rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-lg font-semibold">Confirmar Finalização</h3>
              <button
                className="text-sm text-gray-300 hover:text-white"
                onClick={() => setConfirmarFinalizar(false)}
                disabled={finalizando}
              >
                Fechar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800 text-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2">Nome</th>
                    <th className="text-center px-4 py-2">Pontos</th>
                    <th className="text-center px-4 py-2">Partidas Jogadas</th>
                    <th className="text-center px-4 py-2">Vitórias</th>
                    <th className="text-center px-4 py-2">Derrotas</th>
                    <th className="text-center px-4 py-2">Empates</th>
                  </tr>
                </thead>
                <tbody>
                  {(torneio.ranking ?? []).map((p) => (
                    <tr key={p.id} className="odd:bg-slate-900 even:bg-slate-800/40">
                      <td className="px-4 py-2 font-semibold">{p.user?.name ?? "Participante"}</td>
                      <td className="px-4 py-2 text-center">{p.pontos ?? 0}</td>
                      <td className="px-4 py-2 text-center">{p.partidas ?? 0}</td>
                      <td className="px-4 py-2 text-center">{p.vitorias ?? 0}</td>
                      <td className="px-4 py-2 text-center">{p.derrotas ?? 0}</td>
                      <td className="px-4 py-2 text-center">{p.empates ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-3 px-4 py-4 border-t border-white/10 bg-slate-900/60">
              <button
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm font-semibold"
                onClick={() => setConfirmarFinalizar(false)}
                disabled={finalizando}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-sm font-semibold disabled:opacity-60"
                onClick={finalizarTorneio}
                disabled={finalizando}
              >
                {finalizando ? "Finalizando..." : "Confirmar Finalização"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* SEÇÃO DE PARTICIPANTES */}
      <section className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold mb-4">Participantes</h2>
        {torneio.participantes.length === 0 ? (
          <p className="text-sm opacity-60 text-center py-8">
            Nenhum participante ainda
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {/* Líder (criador) */}
            {(() => {
              const lider = torneio.participantes.find(
                (p) => p.user?.id === torneio.criadorId || p.id === torneio.criadorId
              );
              if (lider) {
                return (
                  <li
                    key={lider.id}
                    className="bg-yellow-400/15 border border-yellow-400/70 p-3 rounded-lg flex items-center gap-3 shadow-inner"
                  >
                    <span className="text-yellow-400">👑</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-yellow-200 text-xs font-bold uppercase tracking-wide">Líder</span>
                      <span className="font-semibold text-white">{lider.user?.name ?? "Líder"}</span>
                      {lider.user?.id === userId && (
                        <span className="text-[11px] bg-white/15 text-white px-2 py-0.5 rounded-full border border-white/20">
                          Você
                        </span>
                      )}
                    </div>
                  </li>
                );
              }
              return null;
            })()}
            {/* Participantes comuns */}
            {torneio.participantes
              .filter((p) => p.user?.id !== torneio.criadorId && p.id !== torneio.criadorId)
              .map((p) => {
                const isCurrentUser = p.user?.id === userId;
                return (
                  <li
                    key={p.id}
                    className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center justify-between flex-wrap gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.user?.name ?? "Participante"}</span>
                      {isCurrentUser && (
                        <span className="text-[11px] bg-white/15 text-white px-2 py-0.5 rounded-full border border-white/20">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {userId === torneio.criadorId && (
                        <button
                          className="px-2 py-1 bg-[#F37272] hover:bg-[#E05F5F] border border-[#E05F5F] text-xs rounded text-white"
                          onClick={() =>
                            setConfirmRemocao({
                              open: true,
                              participanteId: p.id,
                              nome: p.user?.name ?? "Participante",
                            })
                          }
                          disabled={torneio.finalizado}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </main>
  );
}