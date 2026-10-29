"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toFieldErrors, type ActionState } from "@/lib/actions";
import { authRequestError } from "../auth-request";
import { changeEmailSchema } from "../schemas";
import { PasswordField, TextField } from "./fields";

export function ChangeEmailForm() {
  const router = useRouter();
  const [values, setValues] = useState({ newEmail: "", confirmEmail: "", password: "" });
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const parsed = changeEmailSchema.safeParse(Object.fromEntries(formData));
      if (!parsed.success) return toFieldErrors(parsed.error);
      const error = await authRequestError(
        () =>
          authClient.$fetch("/change-email", {
            method: "POST",
            body: { newEmail: parsed.data.newEmail, password: parsed.data.password },
          }),
        "Erro ao alterar e-mail.",
      );
      if (error) {
        toast.error(error);
        return { ok: false, error };
      }
      toast.success("E-mail atualizado com sucesso!");
      router.push("/userSettings");
      return { ok: true };
    },
    null,
  );
  const errors = state?.ok === false ? state.fieldErrors : undefined;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <form action={formAction} className="space-y-4">
      <TextField
        name="newEmail"
        type="email"
        label="Novo e-mail"
        placeholder="Digite seu novo e-mail"
        autoComplete="email"
        value={values.newEmail}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.newEmail}
      />
      <TextField
        name="confirmEmail"
        type="email"
        label="Confirmar novo e-mail"
        placeholder="Confirme o seu novo e-mail"
        autoComplete="email"
        value={values.confirmEmail}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.confirmEmail}
      />
      <PasswordField
        name="password"
        label="Senha"
        placeholder="Digite sua senha"
        autoComplete="current-password"
        value={values.password}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.password}
      />
      <div className="pt-2">
        <Button
          type="submit"
          disabled={pending}
          className="h-auto w-full rounded-sm border-b-4 border-brand-500 bg-brand-400 py-3 text-xs font-bold text-white transition hover:border-brand-900 hover:bg-brand-600"
        >
          {pending ? "Confirmando..." : "Confirmar"}
        </Button>
      </div>
    </form>
  );
}
