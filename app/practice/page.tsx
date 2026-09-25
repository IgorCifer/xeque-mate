// app/practice/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getWeeklyEndDate, formatDateBR } from "./utils/getWeeklyEnd";

export default async function PracticePage() {
  const weeklyEnd = getWeeklyEndDate();
  const weeklyEndLabel = formatDateBR(weeklyEnd);

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <main className="flex-1 flex flex-col px-4 gap-6">
        {/* Card Desafio Semanal */}
        <div className="w-full">
          <h1 className="text-white text-3xl font-bold text-center m-6">
            Desafio Semanal
          </h1>

          <Link href="/practice/weekly-challenge">
            <div className="bg-linear-to-br backdrop-blur bg-white/20 rounded-3xl p-5 border border-white/30 cursor-pointer hover:bg-white/30 transition">
              <h2 className="text-white text-2xl font-bold text-center mb-4">
                Check mate em 2
              </h2>

              {/* Tabuleiro placeholder do desafio */}
              <div className="w-full aspect-square max-w-md mx-auto mb-4 rounded-xl overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-orange-600 via-orange-500 to-orange-600">
                  <span className="text-6xl">♔</span>
                </div>
              </div>

              <p className="text-white text-center text-sm">
                Disponível até {weeklyEndLabel}
              </p>
            </div>
          </Link>
        </div>

        {/* Botões de Opções */}
        <div className="w-full flex flex-col gap-4 ">
          {/* Jogo Treino - FUNCIONAL */}
          <Button 
            asChild
            size="lg"
            className="h-13 w-full rounded-sm bg-[#6BAAFD] hover:bg-[#1E50A4] hover:border-[#152E59] transition text-white text-xs font-bold py-3 border-b-4 border-[#5C9CF0]"
          >
            <Link href="/practice/training-game">
              Jogo Treino
            </Link>
          </Button>

          {/* Desafio Diário - Funcional */}
        <Link href="/practice/daily-challenge">
          <Button
            size="lg"
            className="h-13 w-full rounded-sm bg-[#133E87] hover:bg-[#1E50A4] hover:border-[#152E59] transition text-white text-xs font-bold py-3 border-b-4 border-[#152E59]"
          >
            Desafio Diário
          </Button>
        </Link>
        </div>
      </main>
    </div>
  );
}
