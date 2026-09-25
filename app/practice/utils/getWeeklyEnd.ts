// app/practice/utils/getWeeklyEnd.ts
export function getWeeklyEndDate() {
  const today = new Date();
  const day = today.getDay(); // 0 = domingo ... 6 = sábado
  const daysUntilNextWeek = (7 - day) % 7 || 7; // próximo domingo (ou 7 dias)
  const end = new Date(today);
  end.setDate(today.getDate() + daysUntilNextWeek);
  end.setHours(0, 0, 0, 0);
  return end;
}

export function formatDateBR(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
