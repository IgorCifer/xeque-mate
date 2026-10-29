"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toFieldErrors, type ActionState } from "@/lib/actions";
import { authRequestError } from "../auth-request";
import { changePasswordSchema } from "../schemas";
import { PasswordField } from "./fields";

export function ChangePasswordForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
      if (!parsed.success) return toFieldErrors(parsed.error);
      const error = await authRequestError(
        () =>
          authClient.changePassword({
            currentPassword: parsed.data.currentPassword,
            newPassword: parsed.data.newPassword,
            revokeOtherSessions: true,
          }),
        "Erro ao alterar senha.",
      );
      if (error) {
        toast.error(error);
        return { ok: false, error };
      }
      toast.success("Senha alterada com sucesso! Faça login novamente com a nova senha.");
      router.push("/login");
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
      <PasswordField
        name="currentPassword"
        label="Senha atual"
        placeholder="Digite a sua senha atual"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.currentPassword}
      />
      <PasswordField
        name="newPassword"
        label="Nova senha"
        placeholder="Digite a nova senha"
        autoComplete="new-password"
        value={values.newPassword}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.newPassword}
      />
      <PasswordField
        name="confirmPassword"
        label="Confirmar nova senha"
        placeholder="Confirme a nova senha"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={handleChange}
        disabled={pending}
        errors={errors?.confirmPassword}
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
