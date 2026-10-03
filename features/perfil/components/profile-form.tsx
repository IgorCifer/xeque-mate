"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/actions";
import { updateProfileAction } from "../actions";
import type { ProfileDTO } from "../types";

export function ProfileForm({ profile }: { profile: ProfileDTO }) {
  const [name, setName] = useState(profile.name);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateProfileAction(prev, formData);
      if (result?.ok) toast.success(result.message ?? "Perfil atualizado.");
      else if (result?.error) toast.error(result.error);
      return result;
    },
    null,
  );
  const nameErrors = state?.ok === false ? state.fieldErrors?.name : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameErrors ? true : undefined}
          aria-describedby={nameErrors ? "name-error" : undefined}
          className="rounded-full bg-surface text-black"
        />
        {nameErrors ? (
          <p id="name-error" className="text-xs text-red-300">
            {nameErrors[0]}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-brand-400 hover:bg-brand-600 hover:border-brand-900 transition text-white text-xs font-bold py-3 border-b-4 border-brand-500"
      >
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
