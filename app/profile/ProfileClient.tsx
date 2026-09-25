"use client";

import { Eye, LayoutPanelLeft } from "lucide-react";
import { useState } from "react";
import { RankingDialogContent, RankItem } from "../components/RankingDialogContent";

export function ProfileClient({
  weeklyPosition,
  weeklyRanking,
}: {
  weeklyPosition: number | null;
  weeklyRanking: RankItem[];
}) {
  const [openRanking, setOpenRanking] = useState(false);

  return (
    <>

      <div className="w-full flex items-center gap-4 flex-col">
        <div className="w-[95%] flex items-center justify-between bg-white/20 backdrop-blur-md px-3 py-2 rounded-md">
          <div className="flex items-center gap-2 text-base">
            <LayoutPanelLeft className="w-5 h-5" />
            <span className="font-semibold">
              {weeklyPosition
                ? `${weeklyPosition}º no Ranking Semanal`
                : "Sem posição no ranking semanal"}
            </span>
          </div>

          <div className="w-0.5 h-6 bg-white" />

          <button
            type="button"
            onClick={() => setOpenRanking(true)}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <Eye className="w-6 h-6" />
          </button>
        </div>
      </div>

      {openRanking && (
        <RankingDialogContent
        weekly={weeklyRanking}
        monthly={weeklyRanking}
        allTime={weeklyRanking}
        onClose={() => setOpenRanking(false)}
        />
      )}
    </>
  );
}
