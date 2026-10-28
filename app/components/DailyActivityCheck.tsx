"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { showAchievement } from "@/components/achievement-toast";
import { recordDailyActivityAction } from "@/features/conquistas/actions";

export default function DailyActivityCheck() {
  const pathname = usePathname();
  const lastCheckedDay = useRef<string | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    if (lastCheckedDay.current === today) return;
    lastCheckedDay.current = today;

    recordDailyActivityAction()
      .then((unlockedAchievements) => unlockedAchievements.forEach(showAchievement))
      .catch(() => {
        lastCheckedDay.current = null;
      });
  }, [pathname]);

  return null;
}
