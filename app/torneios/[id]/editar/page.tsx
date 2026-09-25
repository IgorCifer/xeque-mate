"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditarTorneioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [modo, setModo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
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
  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/torneios/${id}`);
        const json = await res.json();

        if (json.error) {
          alert(json.error);
          router.push("/torneios");
          return;
        }

        setNome(json.nome);
        setData(json.data.split("T")[0]); // yyyy-mm-dd
        const legacyToNew: Record<string, string> = {
          "Clássico": "Classic",
          "Rápido": "Rapid",
        };
        setModo(legacyToNew[json.modo] ?? json.modo);
        setDescricao(json.descricao ?? "");
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    }

    load();
  }, [id, router]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    if (data) {
      const chosen = new Date(`${data}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) {
        alert("A data não pode estar no passado");
        return;
      }
    }

    setSalvando(true);

    const res = await fetch(`/api/torneios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, data, modo, descricao: descricao || null }),
    });

    const json = await res.json();

    if (json.error) {
      alert(json.error);
      setSalvando(false);
      return;
    }

    router.push("/torneios");
    setSalvando(false);
  }

  if (loading) return <p className="p-5 text-white">Carregando...</p>;

  return (
    <main className="min-h-screen text-white px-4 py-6 flex flex-col items-center">
      <section className="w-full max-w-4xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/70 via-purple-600/60 to-slate-900/80 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={modeImage(modo)} alt={modo || "modo"} className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-semibold">Editar Torneio</h1>
              <p className="text-sm text-white/80">Atualize os dados do torneio.</p>
            </div>
          </div>
        </div>

        <form onSubmit={salvar} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm text-white/80">Nome</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="p-3 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-white/80">Data</label>
              <input
                type="date"
                value={data}
                min={minDate}
                onChange={(e) => setData(e.target.value)}
                className="p-3 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-white/80">Modo</label>
              <select
                value={modo}
                onChange={(e) => setModo(e.target.value)}
                className="p-3 rounded-xl bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm"
                style={{ borderRadius: "14px" }}
                required
              >
                <option value="Classic">Classic</option>
                <option value="Bullet">Bullet</option>
                <option value="Blitz">Blitz</option>
                <option value="Rapid">Rapid</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm text-white/80">Descrição (opcional)</label>
              <textarea
                className="p-3 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[96px]"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes do torneio, tempo de partida, regras, etc."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/torneios")}
              className="w-full sm:w-auto px-4 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition font-semibold"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto px-4 py-3 rounded-lg bg-[#6BAAFD] hover:bg-[#5C9CF0] transition font-semibold disabled:opacity-60 text-white border border-[#5C9CF0]"
            >
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
