import { safeNextPath } from "@/lib/next-path";
import { AuthScreen } from "@/features/conta/components/auth-screen";
import { LoginForm } from "@/features/conta/components/login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;

  return (
    <AuthScreen title="Login">
      <LoginForm next={safeNextPath(next)} />
    </AuthScreen>
  );
}
