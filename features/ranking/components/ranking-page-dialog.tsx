"use client";

import { useRouter } from "next/navigation";
import type { RankingLists } from "../types";
import { RankingDialog } from "./ranking-dialog";

export function RankingPageDialog({ rankings }: { rankings: RankingLists }) {
  const router = useRouter();

  return (
    <RankingDialog
      rankings={rankings}
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    />
  );
}
