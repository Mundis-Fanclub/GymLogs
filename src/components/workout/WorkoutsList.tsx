"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { ChevronRight, Dumbbell } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { formatVolume } from "@/lib/pr-utils";
import { WorkoutMuscleMap } from "@/components/workout/WorkoutMuscleMap";

export function WorkoutsList({
  userId,
  limit = 50,
}: {
  userId: Id<"users"> | undefined;
  limit?: number;
}) {
  const { locale, t } = useAppPreferences();
  const workouts = useQuery(
    api.workouts.list,
    userId ? { userId, limit } : "skip"
  );

  if (workouts === undefined) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("workouts.loadingCopy")}</p>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title={t("workouts.emptyTitle")}
        description={t("workouts.emptyCopy")}
        action={
          <Link href="/workouts/new">
            <Button className="gap-2">
              <Dumbbell className="h-4 w-4" />
              {t("common.startWorkout")}
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {workouts.map((workout) => (
        <Link key={workout._id} href={`/workouts/${workout._id}`}>
          <Card className="cursor-pointer transition-colors hover:bg-accent/30">
            <CardContent className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <WorkoutMuscleMap
                  muscleGroups={workout.muscleGroups}
                  compact
                  className="w-16 border-0 bg-transparent p-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {format(workout.date, "EEEE, MMMM d, yyyy", {
                      locale: locale === "de" ? de : enUS,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(workout.date, "h:mm a")} · {formatVolume(workout.totalVolume)}{" "}
                    {t("common.kg")} · {workout.totalSets} {t("common.sets")}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
