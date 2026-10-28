import Link from "next/link";
import { FlameIcon, Medal, Settings, TrophyIcon, User } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getAchievements, getStreaks } from "@/features/conquistas/dal";
import { getPoints } from "@/features/perfil/dal";
import { getRankings } from "@/features/ranking/dal";
import { StatCard } from "./stat-card";
import { WeeklyRankingCard } from "./weekly-ranking-card";
import { AchievementGallery } from "./achievement-gallery";

export default async function ProfilePage() {
  const session = await requireSession();
  const actor = { userId: session.user.id };

  const [points, achievements, { currentStreak }, rankings] = await Promise.all([
    getPoints(actor),
    getAchievements(actor),
    getStreaks(actor),
    getRankings(actor),
  ]);

  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 text-white">
      <section className="relative flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
        <Link
          href="/userSettings"
          aria-label="Configurações"
          className="absolute right-3 top-3 rounded-full p-2 transition-colors hover:bg-white/10"
        >
          <Settings className="size-5" />
        </Link>
        <div className="size-20 overflow-hidden rounded-2xl bg-white">
          <User className="size-full p-2" color="gray" />
        </div>
        <h1 className="text-center text-xl font-bold">{session.user.name}</h1>
      </section>

      <section aria-label="Estatísticas" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<FlameIcon className="size-5 text-amber-400" />}
          value={currentStreak}
          label={currentStreak === 1 ? "dia seguido" : "dias seguidos"}
        />
        <StatCard
          icon={<TrophyIcon className="size-5 text-yellow-300" />}
          value={points}
          label="pontos"
        />
        <WeeklyRankingCard
          weeklyPosition={rankings.weeklyPosition}
          rankings={{
            weekly: rankings.weekly,
            monthly: rankings.monthly,
            allTime: rankings.allTime,
          }}
        />
        <StatCard
          icon={<Medal className="size-5 text-emerald-300" />}
          value={`${unlockedCount}/${achievements.length}`}
          label="conquistas"
        />
      </section>

      <AchievementGallery achievements={achievements} />
    </div>
  );
}
