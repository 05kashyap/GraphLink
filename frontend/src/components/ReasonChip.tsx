import type { ReasonKey } from "@/lib/types";
import { REASONS } from "./reasons";

export function ReasonChip({ reason }: { reason: ReasonKey | "follow_back" }) {
  const meta = REASONS[reason];
  return (
    <span
      title={meta.description}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-px text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
    >
      <span className="text-accent-600 dark:text-accent-400">{meta.icon}</span>
      {meta.label}
    </span>
  );
}
