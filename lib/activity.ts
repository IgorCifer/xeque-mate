const TIME_ZONE = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function activityDay(date: Date): string {
  return dayFormat.format(date);
}

function daysBetween(earlier: string, later: string): number {
  return Math.round((Date.parse(later) - Date.parse(earlier)) / DAY_MS);
}

export function computeStreaks(days: string[], today: string) {
  const sorted = [...new Set(days)].sort();

  let longestStreak = 0;
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    streak = i > 0 && daysBetween(sorted[i - 1], sorted[i]) === 1 ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
  }

  const last = sorted.at(-1);
  const currentStreak = last !== undefined && daysBetween(last, today) <= 1 ? streak : 0;

  return { currentStreak, longestStreak };
}
