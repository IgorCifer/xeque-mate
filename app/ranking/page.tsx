import { getAllTimeRanking, getWeeklyRanking, getMonthlyRanking } from "../data/get-alltime-ranking";
import RankingPageClient from "./ranking-page-client";
import { requireSession } from "@/lib/session";

export default async function RankingPage() {
  await requireSession();

  // MUDANÇA: busca os 3 rankings reais
  const weekly = await getWeeklyRanking();
  const monthly = await getMonthlyRanking();
  const allTime = await getAllTimeRanking();

  return (
    <RankingPageClient
      weekly={weekly}
      monthly={monthly}
      allTime={allTime}
    />
  );
}