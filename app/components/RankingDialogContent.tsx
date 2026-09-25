"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

export type RankItem = {
  position: number;
  name: string;
  points: number;
};

type TabKey = "weekly" | "monthly" | "alltime";

export function RankingDialogContent({
  weekly,
  monthly,
  allTime,
  onClose,
}: {
  weekly: RankItem[];
  monthly: RankItem[];
  allTime: RankItem[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("weekly");

  const data =
    activeTab === "weekly"
      ? weekly
      : activeTab === "monthly"
      ? monthly
      : allTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-lg px-4">
        <Card className="rounded-3xl bg-white/10 border border-white/30 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="relative flex items-center px-5 pt-4 pb-2">
            <h1 className="mx-auto text-white text-xl font-bold">Ranking</h1>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold text-white/80"
              aria-label="Fechar ranking"
            >
              X
            </button>
          </div>

          <div className="flex justify-center gap-2 px-4 pb-3 ">
            <TabButton
              active={activeTab === "weekly"}
              onClick={() => setActiveTab("weekly")}
            >
              Semanal
            </TabButton>
            <TabButton
              active={activeTab === "monthly"}
              onClick={() => setActiveTab("monthly")}
            >
              Mensal
            </TabButton>
            <TabButton
              active={activeTab === "alltime"}
              onClick={() => setActiveTab("alltime")}
            >
              All-Time
            </TabButton>
          </div>

          <div className="mx-4 mb-2 rounded-xl bg-white/15 px-3 py-2 text-[11px] font-semibold flex text-white/90">
            <div className="w-[60px]">Rank</div>
            <div className="flex-1">Nome</div>
            <div className="w-20 text-right">Pontos</div>
          </div>

          <div className="px-4 pb-4 space-y-2">
            {data.map((item) => (
              <RankRow key={item.position} item={item} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
        active
          ? "bg-white text-[#344272]"
          : "bg-transparent border border-white/40 text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

function RankRow({ item }: { item: RankItem }) {
  const { position, name, points } = item;

  const isGold = position === 1;
  const isSilver = position === 2;
  const isBronze = position === 3;

  let medalBg = "";
  if (isGold) medalBg = "bg-yellow-400 border-yellow-500";
  if (isSilver) medalBg = "bg-gray-300 border-gray-400";
  if (isBronze) medalBg = "bg-amber-500 border-amber-600";

  return (
    <div className="flex items-center rounded-2xl text-white bg-white/15 px-3 py-2 text-[11px]">
      <div className="w-[60px] flex items-center">
        <div
          className={`w-7 h-7 flex items-center justify-center rounded-full border-2 ${medalBg} font-bold relative`}
        >
          <span className="absolute text-[14px] text-gray-800">
            {position}
          </span>
          <span className="relative text-[13px] text-white">
            {position}
          </span>
        </div>
      </div>
      <div className="flex-1 text-sm font-semibold">{name}</div>
      <div className="w-20 text-right text-sm font-semibold">
        {points} pts
      </div>
    </div>
  );
}
