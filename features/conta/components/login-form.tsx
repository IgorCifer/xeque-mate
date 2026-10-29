"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toFieldErrors, type ActionState } from "@/lib/actions";
import { authPagePath } from "@/lib/next-path";
import { authRequestError } from "../auth-request";
import { loginSchema } from "../schemas";
import { TextField } from "./fields";

export function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const destination = next ?? "/home";
  const [values, setValues] = useState({ email: "", password: "" });
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const parsed = loginSchema.safeParse(Object.fromEntries(formData));
      if (!parsed.success) return toFieldErrors(parsed.error);
      const error = await authRequestError(
        () => authClient.signIn.email({ ...parsed.data, callbackURL: destination }),
        "E-mail ou senha inválidos.",
      );
      if (error) {
        toast.error("E-mail ou senha inválidos.");
        return { ok: false, error };
      }
      router.push(destination);
      return { ok: true };
    },
    null,
  );
  const errors = state?.ok === false ? state.fieldErrors : undefined;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        name="email"
        type="email"
        label="E-mail"
        placeholder="Email"
        autoComplete="email"
        value={values.email}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.email}
      />
      <TextField
        name="password"
        type="password"
        label="Senha"
        placeholder="Senha"
        autoComplete="current-password"
        value={values.password}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.password}
      />
      <div className="mt-12 space-y-4">
        <Button
          type="submit"
          disabled={pending}
          className="h-auto w-full rounded-sm border-b-4 border-brand-500 bg-brand-400 p-3 text-xs font-bold text-white transition hover:border-brand-900 hover:bg-brand-600"
        >
          {pending ? "Entrando..." : "Entrar"}
        </Button>
        <p className="text-center text-xs font-bold text-white">Não possui conta?</p>
        <Button
          asChild
          className="h-auto w-full rounded-sm border-b-4 border-info-600 bg-info-400 p-3 text-xs font-bold text-white transition hover:bg-info-500"
        >
          <Link href={authPagePath("/registrar", next)}>Cadastrar</Link>
        </Button>
      </div>
    </form>
  );
}
