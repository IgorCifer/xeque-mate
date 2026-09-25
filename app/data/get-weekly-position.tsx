// app/data/get-weekly-position.ts
import prisma from "@/lib/prisma";

export async function getWeeklyPosition(userId: string) {
  const users = await prisma.user.findMany({
    orderBy: { points: "desc" },
    select: { id: true },
  });

  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  return index + 1;
}
