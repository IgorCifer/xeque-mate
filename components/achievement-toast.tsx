"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import DynamicIcon from "@/app/utils/icon-convert";

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
}

interface AchievementToastProps {
    achievement: Achievement | null;
    onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (achievement) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Aguarda animação de saída
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    if (!achievement) return null;

    return (
        <div
            className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                }`}
        >
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-2xl p-4 min-w-[320px] max-w-md border-2 border-yellow-400">
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
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook para gerenciar toasts de conquistas
export function useAchievementToast() {
    const [achievement, setAchievement] = useState<Achievement | null>(null);
    const [queue, setQueue] = useState<Achievement[]>([]);

    const showAchievement = (newAchievement: Achievement) => {
        if (achievement) {
            // Se já tem um toast sendo exibido, adiciona à fila
            setQueue(prev => [...prev, newAchievement]);
        } else {
            setAchievement(newAchievement);
        }
    };

    const handleClose = () => {
        setAchievement(null);
        // Mostra o próximo da fila se existir
        if (queue.length > 0) {
            const [next, ...rest] = queue;
            setQueue(rest);
            setTimeout(() => setAchievement(next), 300);
        }
    };

    return {
        achievement,
        showAchievement,
        handleClose,
    };
}
