"use client";

import { Trophy, X } from "lucide-react";
import { toast } from "sonner";
import DynamicIcon from "@/app/utils/icon-convert";

export interface UnlockedAchievement {
    id: string;
    title: string;
    description: string;
    icon: string;
}

function AchievementToast({
    achievement,
    onClose,
}: {
    achievement: UnlockedAchievement;
    onClose: () => void;
}) {
    return (
        <div className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-2xl p-4 border-2 border-yellow-400">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <DynamicIcon iconName={achievement.icon} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy size={16} className="text-yellow-200" />
                        <h3 className="font-bold text-sm">Conquista Desbloqueada!</h3>
                    </div>
                    <p className="font-semibold text-base mb-1">{achievement.title}</p>
                    <p className="text-sm text-yellow-100">{achievement.description}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                    className="text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export function showAchievement(achievement: UnlockedAchievement) {
    toast.custom(
        (id) => <AchievementToast achievement={achievement} onClose={() => toast.dismiss(id)} />,
        { id: `achievement-${achievement.id}`, duration: 5000 },
    );
}
