import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { RankingLists } from "../types";
import { RankingTabs } from "./ranking-tabs";

export function RankingDialog({
  rankings,
  trigger,
  open,
  onOpenChange,
}: {
  rankings: RankingLists;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="rounded-3xl border-white/30 bg-white/10 text-white shadow-2xl backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Ranking</DialogTitle>
          <DialogDescription className="sr-only">
            Classificação semanal, mensal e de todos os tempos
          </DialogDescription>
        </DialogHeader>
        <RankingTabs rankings={rankings} />
      </DialogContent>
    </Dialog>
  );
}
