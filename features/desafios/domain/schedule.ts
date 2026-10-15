import { dayStart, nextDayStart, nextWeekStart, TIME_ZONE, weekStart } from "@/lib/activity";
import type { ChallengeType } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export const CHALLENGE_RATING: Record<ChallengeType, { gte: number; lte: number }> = {
  daily: { gte: 1200, lte: 1699 },
  weekly: { gte: 1700, lte: 2000 },
};

export function challengeSeed(type: ChallengeType, now: Date) {
  return type === "daily"
    ? Math.floor(dayStart(now).getTime() / DAY_MS)
    : Math.floor(weekStart(now).getTime() / WEEK_MS);
}

export function nextChallengeChange(type: ChallengeType, now: Date) {
  return type === "daily" ? nextDayStart(now) : nextWeekStart(now);
}

export function formatDateBR(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
