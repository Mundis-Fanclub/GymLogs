"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { formatWeight } from "@/lib/pr-utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

interface RecentPRsProps {
  userId: Id<"users">;
}

export function RecentPRs({ userId }: RecentPRsProps) {
  const { t } = useAppPreferences();
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const prs = useQuery(api.prs.getRecent, { userId, since });
  const typeLabels = {
    weight: t("prs.heaviestWeight"),
    "1rm": t("prs.best1rm"),
    volume: t("prs.bestVolume"),
  };

  if (prs === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (prs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {t("prs.noRecent")}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {prs.map((pr, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2 rounded-md text-sm"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            <span className="font-medium">{pr.exerciseName}</span>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <span>{typeLabels[pr.type]}</span>
            <span className="ml-2 font-medium text-foreground">
              {formatWeight(pr.value)} {t("common.kg")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
