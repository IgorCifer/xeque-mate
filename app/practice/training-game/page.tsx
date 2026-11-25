import { TrainingGame } from "@/features/treino/components/training-game";
import { requireSession } from "@/lib/session";

export default async function TrainingGamePage() {
  await requireSession();
  return <TrainingGame />;
}
