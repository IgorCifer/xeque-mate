import type { ReactNode } from "react";

export const statCardClassName =
  "relative flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3 text-left backdrop-blur-md";

export function StatCardContent({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
}) {
  return (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-2xl font-bold leading-tight tabular-nums">{value}</span>
        <span className="text-xs text-white/70">{label}</span>
      </span>
    </>
  );
}

export function StatCard(props: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className={statCardClassName}>
      <StatCardContent {...props} />
    </div>
  );
}
