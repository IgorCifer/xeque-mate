import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { FaUser } from "react-icons/fa";
import { FlameIcon, Settings, TrophyIcon } from "lucide-react";
import { getUserPoints } from "../data/get-user-points";
import { getAchievements } from "../data/get-achievements";
import DynamicIcon from "../utils/icon-convert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { getWeeklyPosition } from "../data/get-weekly-position";
import { ProfileClient } from "./ProfileClient";
import { getAllTimeRanking, getWeeklyRanking } from "../data/get-alltime-ranking";




export default async function ProfilePage() {

  const rawHeaders = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders.entries())
  });

  if (!session) return notFound();

  const points = await getUserPoints(session?.user.id);

  const achievements = await getAchievements(session.user.id);

  const weeklyPosition = await getWeeklyPosition(session.user.id);
  const weeklyRanking = await getWeeklyRanking();

  return (
    <>
      <div className="text-white py-10 px-3 gap-5 flex flex-col items-center">
        <div className="w-full gap-4 flex flex-col items-center">
          <div className="inline-block bg-white w-20 h-20 rounded-lg overflow-hidden">
            <FaUser size={"full"} className="p-2" color="gray" />
          </div>
          <h3 className="w-[70%] text-center rounded-xl font-bold bg-white/20 backdrop-blur-md">
            {session.user.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-base w-[95%] bg-white/20 backdrop-blur-md p-2 rounded-md">
          <div className="flex items-center text-yellow-400 gap-2">
            <FlameIcon />
            <h2>Sequência de X dias</h2>
          </div>
          <div className="w-0.5 h-6 bg-white" />
          <div className="flex items-center gap-2">
            <TrophyIcon />
            <h2>
              {points?.points ?? 0}
            </h2>
          </div>
        </div>
        <ProfileClient
          weeklyPosition={weeklyPosition}
          weeklyRanking={weeklyRanking}
        />
        <div className="w-full flex items-center gap-4 flex-col">
          <div className="bg-white/20 w-[95%] text-center backdrop-blur-md py-2 rounded-md border-2">
            <h2>Galeria de conquistas</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {achievements.map((achievement) => (
              <Tooltip key={achievement.id}>
                <TooltipTrigger>
                  <div
                    className={`p-4 border-2 rounded-lg backdrop-blur-lg transition-all ${achievement.unlocked
                        ? "border-white bg-white/20"
                        : "border-gray-500 bg-gray-900/40 opacity-50 grayscale"
                      }`}
                  >
                    <DynamicIcon iconName={achievement.icon} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="text-sm">{achievement.description}</p>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </TooltipContent>

              </Tooltip>
            ))}
          </div>
        </div>
      </div>
      <Link href={"/userSettings"} className="text-white absolute top-23 right-5">
        <Settings />
      </Link>
    </>
  );
}
