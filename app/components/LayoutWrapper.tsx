"use client";
import { usePathname } from "next/navigation";
import NavBar from "./navbar";
import TittleHeader from "./tittle-header";
import DailyActivityCheck from "./DailyActivityCheck";
import { AchievementProvider } from "@/components/achievement-provider";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeaderNav = pathname === "/login" || pathname == "/registrar";

  return (
    <AchievementProvider>
      {!hideHeaderNav && <TittleHeader />}
      <div className={hideHeaderNav ? "" : "pb-24"}>{children}</div>
      {!hideHeaderNav && <NavBar />}
      {!hideHeaderNav && <DailyActivityCheck />}
    </AchievementProvider>
  );
}
