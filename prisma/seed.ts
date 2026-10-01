import { createScriptClient } from "./script-client";

const prisma = createScriptClient();

const achievements = [
  {
    id: "c55c466f-8d0d-4889-9d19-75ff60e15467",
    title: "Primeiro Torneio",
    icon: "Trophy",
    description: "Participe do seu primeiro torneio na plataforma.",
  },
  {
    id: "0fc48b96-1499-4905-be78-37874a6a22e3",
    title: "Competidor Frequente",
    icon: "Flag",
    description: "Participe de 5 torneios na plataforma.",
  },
  {
    id: "caac2f64-59e6-4be9-9b07-a5f390ca1ace",
    title: "Começo da Jornada",
    icon: "Calendar",
    description: "Entre na plataforma durante 3 dias seguidos.",
  },
  {
    id: "fbe1873f-3e4c-49f9-a85b-a4fb68e8d09a",
    title: "Dedicado",
    icon: "CalendarCheck",
    description: "Entre na plataforma durante 7 dias seguidos.",
  },
  {
    id: "3fcf0527-c906-4cd1-97b1-b78fe5d9fb2d",
    title: "Primeira Vitória",
    icon: "Medal",
    description: "Vença sua primeira partida de torneio.",
  },
  {
    id: "6c2ca3d9-1d7d-4ca2-bba5-ca7b33bf185d",
    title: "Campeão de Rodada",
    icon: "Sword",
    description: "Vença 10 partidas de torneio.",
  },
  {
    id: "fe3369a7-f76e-4e5d-a7a9-d2fac718ee16",
    title: "Campeão Estreante",
    icon: "Crown",
    description: "Ganhe seu primeiro torneio completo.",
  },
  {
    id: "4a77c438-a518-4ce3-af82-cc2a94ac261a",
    title: "Lenda dos Torneios",
    icon: "Shield",
    description: "Ganhe 5 torneios completos.",
  },
];

async function main() {
  console.log("🏆 Seeding achievements...");

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }

  console.log("✅ Conquistas criadas com sucesso!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
