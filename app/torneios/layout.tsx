import { requireSession } from "@/lib/session";

// As páginas de torneio são client components e buscam os dados pela API,
// que checa a sessão; aqui o layout só manda quem não está logado para o login.
export default async function TorneiosLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
