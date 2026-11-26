"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { showAchievement } from "@/components/achievement-toast";
import { acceptConviteAction } from "../actions";
import type { AcceptConviteState } from "../types";

export function AceitarConviteForm({ torneioId }: { torneioId: string }) {
  const router = useRouter();
  const [, formAction, pending] = useActionState(
    async (prev: AcceptConviteState, formData: FormData) => {
      const result = await acceptConviteAction(prev, formData);
      if (result?.ok) {
        result.achievements?.forEach(showAchievement);
        toast.success(result.message ?? "Você entrou no torneio!");
        router.push("/torneios");
      } else if (result) {
        const fieldError = Object.values(result.fieldErrors ?? {}).flat().find(Boolean);
        toast.error(result.error ?? fieldError ?? "Falha ao aceitar convite");
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-3">
      <input type="hidden" name="torneioId" value={torneioId} />
      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-success-500 bg-success-400 font-semibold text-white hover:bg-success-500"
      >
        {pending ? "Entrando..." : "Aceitar convite"}
      </Button>
      <Button
        asChild
        className="w-full rounded-lg border border-danger-600 bg-danger-400 font-semibold text-white hover:bg-danger-600"
      >
        <Link href="/torneios">Recusar convite</Link>
      </Button>
    </form>
  );
}
