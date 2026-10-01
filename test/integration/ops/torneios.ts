import { POST as createTorneioRoute } from "@/app/api/torneios/route";
import { PUT as updateTorneioRoute } from "@/app/api/torneios/[id]/route";
import {
  GET as getConviteRoute,
  POST as acceptConviteRoute,
} from "@/app/api/torneios/[id]/convite/route";
import { POST as createRodadasRoute } from "@/app/api/torneios/[id]/rodadas/route";
import { PATCH as updateResultadoRoute } from "@/app/api/torneios/[id]/partidas/[partidaId]/route";
import type { ResultadoPartida } from "@/app/generated/prisma2/client";
import { callRoute } from "../http";
import { createUser, createUsers, type TestUser } from "../users";

export async function criarTorneio(user: TestUser, nome = "Torneio de teste") {
  return callRoute(createTorneioRoute, {
    method: "POST",
    path: "/api/torneios",
    user,
    body: { nome, data: "2099-01-01", modo: "Blitz" },
  });
}

export async function verConvite(user: TestUser | undefined, torneioId: string) {
  return callRoute(getConviteRoute, {
    method: "GET",
    path: `/api/torneios/${torneioId}/convite`,
    user,
    params: { id: torneioId },
  });
}

export async function aceitarConvite(user: TestUser, torneioId: string) {
  return callRoute(acceptConviteRoute, {
    method: "POST",
    path: `/api/torneios/${torneioId}/convite`,
    user,
    params: { id: torneioId },
  });
}

export async function gerarRodadas(user: TestUser, torneioId: string, rounds = 1) {
  return callRoute(createRodadasRoute, {
    method: "POST",
    path: `/api/torneios/${torneioId}/rodadas`,
    user,
    body: { rounds },
    params: { id: torneioId },
  });
}

export async function lancarResultado(
  user: TestUser,
  torneioId: string,
  partidaId: string,
  resultado: ResultadoPartida,
) {
  return callRoute(updateResultadoRoute, {
    method: "PATCH",
    path: `/api/torneios/${torneioId}/partidas/${partidaId}`,
    user,
    body: { resultado },
    params: { id: torneioId, partidaId },
  });
}

export async function finalizar(user: TestUser, torneioId: string) {
  return callRoute(updateTorneioRoute, {
    method: "PUT",
    path: `/api/torneios/${torneioId}`,
    user,
    body: { finalizado: true },
    params: { id: torneioId },
  });
}

export async function seedTorneio(jogadores: number) {
  const criador = await createUser("Criador");
  const criado = await criarTorneio(criador);
  if (criado.status !== 201 || typeof criado.json?.id !== "string") {
    throw new Error(`Falha ao criar torneio: ${criado.status} ${JSON.stringify(criado.json)}`);
  }
  const torneioId = criado.json.id;
  const convidados = await createUsers(jogadores - 1, "Convidado");
  for (const convidado of convidados) {
    const aceite = await aceitarConvite(convidado, torneioId);
    if (aceite.status !== 200) {
      throw new Error(`Falha ao aceitar convite: ${aceite.status} ${JSON.stringify(aceite.json)}`);
    }
  }
  return { criador, convidados, torneioId };
}
