import { AuthScreen } from "@/features/conta/components/auth-screen";
import { RegisterForm } from "@/features/conta/components/register-form";

export default function RegisterPage() {
  return (
    <AuthScreen title="Cadastro de Usuário">
      <RegisterForm />
    </AuthScreen>
  );
}
