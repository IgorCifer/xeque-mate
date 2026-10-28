import { ChevronRight, LayoutPanelLeft } from "lucide-react";
import { RankingDialog } from "@/features/ranking/components/ranking-dialog";
import type { RankItemDTO } from "@/features/ranking/types";
import { cn } from "@/lib/utils";
import { StatCardContent, statCardClassName } from "./stat-card";

export function WeeklyRankingCard({
  weeklyPosition,
  weeklyRanking,
}: {
  weeklyPosition: number | null;
  weeklyRanking: RankItemDTO[];
}) {
  return (
    <RankingDialog
      rankings={{ weekly: weeklyRanking, monthly: weeklyRanking, allTime: weeklyRanking }}
      trigger={
        <button
          type="button"
          aria-label="Ver ranking semanal"
          className={cn(
            statCardClassName,
            "transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-brand-400",
          )}
        >
          <StatCardContent
            icon={<LayoutPanelLeft className="size-5 text-brand-400" />}
            value={weeklyPosition ? `${weeklyPosition}º` : "—"}
            label="ranking semanal"
          />
          <ChevronRight className="absolute right-2 top-2 size-4 text-white/50" />
        </button>
      }
    />
  );
}
