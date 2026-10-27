"use client";

import { ChevronRight, LayoutPanelLeft } from "lucide-react";
import { useState } from "react";
import { RankingDialogContent, RankItem } from "../components/RankingDialogContent";
import { StatCardContent, statCardClassName } from "./stat-card";

export function WeeklyRankingCard({
  weeklyPosition,
  weeklyRanking,
}: {
  weeklyPosition: number | null;
  weeklyRanking: RankItem[];
}) {
  const [openRanking, setOpenRanking] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenRanking(true)}
        aria-label="Ver ranking semanal"
        className={`${statCardClassName} transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-brand-400`}
      >
        <StatCardContent
          icon={<LayoutPanelLeft className="size-5 text-brand-400" />}
          value={weeklyPosition ? `${weeklyPosition}º` : "—"}
          label="ranking semanal"
        />
        <ChevronRight className="absolute right-2 top-2 size-4 text-white/50" />
      </button>

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
