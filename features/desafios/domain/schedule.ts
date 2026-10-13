import type { ChallengeType } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const CHALLENGE_RATING: Record<ChallengeType, { gte: number; lte: number }> = {
  daily: { gte: 1200, lte: 1699 },
  weekly: { gte: 1700, lte: 2000 },
};

export function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / DAY_MS) + 1;
}

export function weekOfYear(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date.getTime() - firstDay.getTime()) / DAY_MS);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

export function challengeSeed(type: ChallengeType, now: Date) {
  return type === "daily"
    ? now.getFullYear() * 1000 + dayOfYear(now)
    : now.getFullYear() * 100 + weekOfYear(now);
}

export function nextDailyChange(now: Date) {
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function nextWeeklyChange(now: Date) {
  const next = new Date(now);
  next.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  next.setHours(0, 0, 0, 0);
  return next;
}

export function nextChallengeChange(type: ChallengeType, now: Date) {
  return type === "daily" ? nextDailyChange(now) : nextWeeklyChange(now);
}

export function formatDateBR(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
