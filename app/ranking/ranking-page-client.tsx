"use client";

import { RankingDialogContent, RankItem } from "../components/RankingDialogContent";

export default function RankingPageClient({
  weekly,
  monthly,
  allTime,
}: {
  weekly: RankItem[];
  monthly: RankItem[];
  allTime: RankItem[];
}) {
  return (
    <RankingDialogContent
      weekly={weekly}
      monthly={monthly}
      allTime={allTime}
      onClose={() => history.back()}
    />
  );
}
