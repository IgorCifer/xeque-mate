"use client";

import { useState } from "react";
import type { AchievementDTO } from "@/features/conquistas/types";
import { cn } from "@/lib/utils";
import DynamicIcon from "../utils/icon-convert";

export function AchievementGallery({ achievements }: { achievements: AchievementDTO[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = achievements.find((achievement) => achievement.id === selectedId);
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Conquistas</h2>
        <span className="text-sm text-white/70">
          {unlockedCount} de {achievements.length}
        </span>
      </header>

      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
        {achievements.map((achievement) => (
          <li key={achievement.id}>
            <button
              type="button"
              aria-label={achievement.title}
              aria-pressed={achievement.id === selectedId}
              onClick={() =>
                setSelectedId((current) => (current === achievement.id ? null : achievement.id))
              }
              className={cn(
                "flex aspect-square w-full items-center justify-center rounded-xl border-2 transition",
                achievement.unlocked
                  ? "border-white/80 bg-white/20"
                  : "border-white/15 bg-black/30 opacity-50 grayscale",
                achievement.id === selectedId && "ring-2 ring-brand-400 opacity-100",
              )}
            >
              <DynamicIcon iconName={achievement.icon} />
            </button>
          </li>
        ))}
      </ul>

      <div aria-live="polite" className="min-h-16 rounded-xl bg-black/20 p-3 text-sm">
        {selected ? (
          <>
            <p className="font-semibold">{selected.title}</p>
            <p className="text-white/80">{selected.description}</p>
            <p className="mt-1 text-xs text-white/60">
              {selected.unlocked && selected.unlockedAt
                ? `Desbloqueada em ${new Date(selected.unlockedAt).toLocaleDateString("pt-BR")}`
                : "Ainda bloqueada"}
            </p>
          </>
        ) : (
          <p className="text-white/70">Toque em uma conquista para ver os detalhes.</p>
        )}
      </div>
    </section>
  );
}
