import { requireActor } from "@/lib/session";
import { getRankings } from "@/features/ranking/dal";
import { RankingPageDialog } from "@/features/ranking/components/ranking-page-dialog";

export default async function RankingPage() {
  const actor = await requireActor();
  const { weekly, monthly, allTime } = await getRankings(actor);

  return <RankingPageDialog rankings={{ weekly, monthly, allTime }} />;
}
