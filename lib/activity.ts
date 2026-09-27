const TIME_ZONE = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const offsetFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  timeZoneName: "longOffset",
});

export function activityDay(date: Date): string {
  return dayFormat.format(date);
}

function offsetMs(date: Date): number {
  const name = offsetFormat.formatToParts(date).find((p) => p.type === "timeZoneName")?.value;
  const match = name?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3])) * 60 * 1000;
}

export function weekStart(now: Date): Date {
  const today = Date.parse(activityDay(now));
  const sunday = today - new Date(today).getUTCDay() * DAY_MS;
  return new Date(sunday - offsetMs(new Date(sunday)));
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
