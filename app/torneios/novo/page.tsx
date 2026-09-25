"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoTorneioPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [modo, setModo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    if (data) {
      const chosen = new Date(`${data}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) {
        setErro("A data não pode estar no passado");
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/torneios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, data, modo, descricao: descricao || null }),
    });

    const json = await res.json();

    if (!res.ok) {
      setErro(json.error || "Erro ao criar torneio");
      setLoading(false);
      return;
    }   

    router.push("/torneios");
  }

  return (
    <main className="min-h-screen text-white px-4 py-6 flex flex-col items-center">
      <section className="w-full max-w-4xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/70 via-purple-600/60 to-slate-900/80 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/black-king.png" alt="Imagem" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-semibold">Criar Novo Torneio</h1>
              <p className="text-sm text-white/80">Defina nome, data e modo para começar.</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm text-white/80">Nome do Torneio</label>
              <input
                type="text"
                className="p-3 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            {/* Data */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-white/80">Data</label>
              <input
                type="date"
                className="p-3 rounded-lg bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data}
                min={minDate}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>

            {/* Modo */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-white/80">Modo</label>
              <select
                className="p-3 rounded-xl bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm"
                style={{ borderRadius: "14px" }}
                value={modo}
                onChange={(e) => setModo(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                <option value="Classic">Classic</option>
                <option value="Bullet">Bullet</option>
                <option value="Blitz">Blitz</option>
                <option value="Rapid">Rapid</option>
              </select>
            </div>

            {/* Descrição (opcional) */}
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

          {erro && (
            <p className="text-[#FCE2E2] text-sm bg-[#3C0D0D]/70 p-2 rounded">
              {erro}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-4 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-3 rounded-lg bg-[#6BAAFD] hover:bg-[#5C9CF0] transition font-semibold disabled:opacity-60 text-white border border-[#5C9CF0]"
            >
              {loading ? "Criando..." : "Criar Torneio"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
