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
import { registerSchema } from "../schemas";
import { TextField } from "./fields";

const REGISTER_ERROR = "Não foi possível cadastrar. Tente novamente.";

export function RegisterForm({ next }: { next: string | null }) {
  const router = useRouter();
  const destination = next ?? "/home";
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const parsed = registerSchema.safeParse(Object.fromEntries(formData));
      if (!parsed.success) return toFieldErrors(parsed.error);
      const { name, email, password } = parsed.data;
      const error = await authRequestError(
        () => authClient.signUp.email({ name, email, password, callbackURL: destination }),
        REGISTER_ERROR,
      );
      if (error) {
        toast.error(REGISTER_ERROR);
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
        name="name"
        label="Nome"
        placeholder="Nome"
        autoComplete="name"
        value={values.name}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.name}
      />
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
        autoComplete="new-password"
        value={values.password}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.password}
      />
      <TextField
        name="repeatPassword"
        type="password"
        label="Repetir senha"
        placeholder="Repetir senha"
        autoComplete="new-password"
        value={values.repeatPassword}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.repeatPassword}
      />
      <div className="mt-12 space-y-4">
        <Button
          type="submit"
          disabled={pending}
          className="h-auto w-full rounded-sm border-b-4 border-brand-500 bg-brand-400 p-3 text-xs font-bold text-white transition hover:border-brand-900 hover:bg-brand-600"
        >
          {pending ? "Cadastrando..." : "Cadastrar"}
        </Button>
        <p className="text-center text-xs font-bold text-white">Já possui uma conta?</p>
        <Button
          asChild
          className="h-auto w-full rounded-sm border-b-4 border-info-600 bg-info-400 p-3 text-xs font-bold text-white transition hover:bg-info-500"
        >
          <Link href={authPagePath("/login", next)}>Entrar</Link>
        </Button>
      </div>
    </form>
  );
}
