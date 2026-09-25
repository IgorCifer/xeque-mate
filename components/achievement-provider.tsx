"use client";

import { createContext, useContext, ReactNode } from "react";
import { AchievementToast, useAchievementToast } from "@/components/achievement-toast";

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
}

interface AchievementContextType {
    showAchievement: (achievement: Achievement) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function AchievementProvider({ children }: { children: ReactNode }) {
    const { achievement, showAchievement, handleClose } = useAchievementToast();

    return (
        <AchievementContext.Provider value={{ showAchievement }}>
            {children}
            <AchievementToast achievement={achievement} onClose={handleClose} />
        </AchievementContext.Provider>
    );
}

export function useAchievements() {
    const context = useContext(AchievementContext);
    if (context === undefined) {
        throw new Error("useAchievements must be used within AchievementProvider");
    }
    return context;
}
