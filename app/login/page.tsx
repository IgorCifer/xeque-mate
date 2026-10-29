import { AuthScreen } from "@/features/conta/components/auth-screen";
import { LoginForm } from "@/features/conta/components/login-form";

export default function LoginPage() {
  return (
    <AuthScreen title="Login">
      <LoginForm />
    </AuthScreen>
  );
}
