import { requireActor } from "@/lib/session";
import { getChallenge } from "@/features/desafios/dal";
import { ChallengeScreen } from "@/features/desafios/components/challenge-screen";

export default async function WeeklyChallengePage() {
  const actor = await requireActor();
  const challenge = await getChallenge(actor, "weekly");

  return <ChallengeScreen challenge={challenge} title="Desafio Semanal" />;
}
