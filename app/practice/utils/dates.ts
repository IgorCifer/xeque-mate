// app/practice/utils/dates.ts
export function getWeeklyEndDate() {
  const today = new Date();
  const day = today.getDay(); // 0..6
  const daysUntilNextWeek = (7 - day) % 7 || 7;
  const end = new Date(today);
  end.setDate(today.getDate() + daysUntilNextWeek);
  end.setHours(0, 0, 0, 0);
  return end;
}

export function getDailyEndDate() {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 1);
  end.setHours(0, 0, 0, 0); // meia-noite de amanhã
  return end;
}

export function formatDateBR(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
