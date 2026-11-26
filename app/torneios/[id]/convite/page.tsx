import { requireActor } from "@/lib/session";
import { DomainError } from "@/lib/errors";
import { getConvite } from "@/features/torneios/dal";
import { ConviteCard } from "@/features/torneios/components/convite-card";
import { ConviteIndisponivel } from "@/features/torneios/components/convite-indisponivel";
import type { ConviteDTO } from "@/features/torneios/types";

type ConvitePageProps = {
  params: Promise<{ id: string }>;
};

type ConviteResult = { ok: true; convite: ConviteDTO } | { ok: false; motivo: string };

async function loadConvite(id: string): Promise<ConviteResult> {
  const actor = await requireActor();
  try {
    return { ok: true, convite: await getConvite(actor, id) };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, motivo: error.message };
    throw error;
  }
}

export default async function ConvitePage({ params }: ConvitePageProps) {
  const { id } = await params;
  const result = await loadConvite(id);

  if (!result.ok) return <ConviteIndisponivel motivo={result.motivo} />;
  return <ConviteCard convite={result.convite} />;
}
