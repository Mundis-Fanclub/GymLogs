"use client";

import { cn } from "@/lib/utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

type PRType = "weight" | "1rm" | "reps";

interface PRBadgeProps {
  type?: PRType;
  className?: string;
}

export function PRBadge({ type = "weight", className }: PRBadgeProps) {
  const { t } = useAppPreferences();
  const labels: Record<PRType, string> = {
    weight: "PR",
    "1rm": "PR 1RM",
    reps: `PR ${t("common.reps")}`,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
        "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        className
      )}
    >
      {labels[type]}
    </span>
  );
}
