"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AchievementToast, useAchievementToast } from "@/components/achievement-toast";

export default function DailyActivityCheck() {
  const pathname = usePathname();
  const lastCheckedDay = useRef<string | null>(null);
  const { achievement, handleClose, showAchievement } = useAchievementToast();

  useEffect(() => {
    const today = new Date().toDateString();
    if (lastCheckedDay.current === today) return;
    lastCheckedDay.current = today;

    fetch("/api/achievements/check-login", { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((json) => {
        if (Array.isArray(json.unlockedAchievements)) {
          json.unlockedAchievements.forEach(showAchievement);
        }
      })
      .catch(() => {
        lastCheckedDay.current = null;
      });
  }, [pathname, showAchievement]);

  return <AchievementToast achievement={achievement} onClose={handleClose} />;
}
