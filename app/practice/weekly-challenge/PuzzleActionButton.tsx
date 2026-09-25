"use client";

import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

type PuzzleActionButtonProps = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
};

export function PuzzleActionButton({ icon, label, onClick }: PuzzleActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 text-white"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/15 border border-white/30">
        {icon}
      </div>
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </Button>
  );
}
