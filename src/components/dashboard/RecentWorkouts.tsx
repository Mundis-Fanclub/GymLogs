"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

interface RecentWorkoutsProps {
  userId: Id<"users">;
}

export function RecentWorkouts({ userId }: RecentWorkoutsProps) {
  const { locale, t } = useAppPreferences();
  const workouts = useQuery(api.workouts.getRecent, { userId, limit: 5 });

  if (workouts === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {t("workouts.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {workouts.map((w) => (
        <Link
          key={w._id}
          href={`/workouts/${w._id}`}
          className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors text-sm"
        >
          <span>
            {format(w.date, "EEE, MMM d", {
              locale: locale === "de" ? de : enUS,
            })}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-xs">{format(w.date, "h:mm a")}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}
