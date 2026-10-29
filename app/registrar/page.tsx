import { safeNextPath } from "@/lib/next-path";
import { AuthScreen } from "@/features/conta/components/auth-screen";
import { RegisterForm } from "@/features/conta/components/register-form";

export default async function RegisterPage(props: PageProps<"/registrar">) {
  const { next } = await props.searchParams;

  return (
    <AuthScreen title="Cadastro de Usuário">
      <RegisterForm next={safeNextPath(next)} />
    </AuthScreen>
  );
}
