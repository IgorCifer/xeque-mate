import { requireSession } from "@/lib/session";

// Cobre o jogo de treino (client component); as páginas de servidor da prática
// também chamam requireSession, porque o layout não impede a página de rodar.
export default async function PracticeLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
