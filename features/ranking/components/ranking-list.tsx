import { cn } from "@/lib/utils";
import type { RankItemDTO } from "../types";

const MEDALS: Record<number, string> = {
  1: "border-yellow-500 bg-yellow-400",
  2: "border-gray-400 bg-gray-300",
  3: "border-amber-600 bg-amber-500",
};

function RankRow({ item }: { item: RankItemDTO }) {
  return (
    <li className="flex items-center rounded-2xl bg-white/15 px-3 py-2 text-[11px] text-white">
      <div className="flex w-[60px] items-center">
        <div
          className={cn(
            "relative flex size-7 items-center justify-center rounded-full border-2 font-bold",
            MEDALS[item.position],
          )}
        >
          <span className="absolute text-[14px] text-gray-800">{item.position}</span>
          <span className="relative text-[13px] text-white">{item.position}</span>
        </div>
      </div>
      <div className="flex-1 text-sm font-semibold">{item.name}</div>
      <div className="w-20 text-right text-sm font-semibold">{item.points} pts</div>
    </li>
  );
}

export function RankingList({ items }: { items: RankItemDTO[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex rounded-xl bg-white/15 px-3 py-2 text-[11px] font-semibold text-white/90">
        <div className="w-[60px]">Rank</div>
        <div className="flex-1">Nome</div>
        <div className="w-20 text-right">Pontos</div>
      </div>
      <ol className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
        {items.map((item, index) => (
          <RankRow key={index} item={item} />
        ))}
      </ol>
    </div>
  );
}
