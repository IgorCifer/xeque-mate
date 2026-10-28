import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RankingLists } from "../types";
import { RankingList } from "./ranking-list";

const TABS: { value: keyof RankingLists; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "allTime", label: "All-Time" },
];

export function RankingTabs({ rankings }: { rankings: RankingLists }) {
  return (
    <Tabs defaultValue="weekly" className="gap-3">
      <TabsList className="mx-auto h-auto gap-2 bg-transparent p-0">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex-none rounded-full border-white/40 px-4 py-1.5 text-xs font-semibold text-white/80 hover:text-white data-[state=active]:border-white data-[state=active]:bg-white data-[state=active]:text-brand-700"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <RankingList items={rankings[tab.value]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
