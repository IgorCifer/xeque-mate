"use server";

import { refresh } from "next/cache";
import { requireActor } from "@/lib/session";
import { recordDailyActivity } from "./dal";
import type { UnlockedAchievement } from "./types";

export async function recordDailyActivityAction(): Promise<UnlockedAchievement[]> {
  const actor = await requireActor();
  const { newDay, unlockedAchievements } = await recordDailyActivity(actor);
  if (newDay) refresh();
  return unlockedAchievements;
}
