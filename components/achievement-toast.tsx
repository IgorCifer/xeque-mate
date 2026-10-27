"use client";

import { toast } from "sonner";
import DynamicIcon from "@/app/utils/icon-convert";

export interface UnlockedAchievement {
    id: string;
    title: string;
    description: string;
    icon: string;
}

export function showAchievement(achievement: UnlockedAchievement) {
    toast(`Conquista desbloqueada: ${achievement.title}`, {
        id: `achievement-${achievement.id}`,
        description: achievement.description,
        icon: (
            <span className="text-warning [&>svg]:size-4">
                <DynamicIcon iconName={achievement.icon} />
            </span>
        ),
        duration: 7000,
        closeButton: true,
        classNames: {
            toast: "bg-brand-900! border-brand-400! text-white!",
            description: "text-white/80!",
            closeButton: "bg-brand-900! border-brand-400! text-white! hover:bg-brand-800!",
        },
    });
}
