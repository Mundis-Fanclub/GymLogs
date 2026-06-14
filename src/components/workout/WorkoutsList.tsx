"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
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
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{t("workouts.loadingCopy")}</p>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
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
          <Card className="group cursor-pointer transition-colors hover:border-brand/30">
            <CardContent className="grid grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
              <div className="relative h-12 overflow-hidden rounded-lg">
                <Image
                  src="/brand/playlist-hero.png"
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="54px"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {format(workout.date, "EEEE", {
                    locale: locale === "de" ? de : enUS,
                  })}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {format(workout.date, "dd.MM. HH:mm")} · {formatVolume(workout.totalVolume)}{" "}
                  {t("common.kg")} · {workout.totalSets} {t("common.sets")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
