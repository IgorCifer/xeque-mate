import { requireActor } from "@/lib/session";
import { getChallenge } from "@/features/desafios/dal";
import { ChallengeScreen } from "@/features/desafios/components/challenge-screen";

export default async function DailyChallengePage() {
  const actor = await requireActor();
  const challenge = await getChallenge(actor, "daily");

  return <ChallengeScreen challenge={challenge} title="Desafio Diário" />;
}
