"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VolumeBarChart } from "@/components/charts/VolumeBarChart";
import {
  WorkoutsPerWeekChart,
  type FrequencyPeriod,
} from "@/components/charts/WorkoutsPerWeekChart";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Dumbbell, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutMuscleMap } from "@/components/workout/WorkoutMuscleMap";
import { BODY_PARTS, toBodyPart, type BodyPart } from "@/lib/muscle-groups";

export default function AnalyticsPage() {
  const { userId, isLoaded } = useConvexUser();
  const { t } = useAppPreferences();
  const [frequencyPeriod, setFrequencyPeriod] =
    useState<FrequencyPeriod>("week");

  const weeklyVolume = useQuery(
    api.analytics.getWeeklyVolume,
    userId ? { userId, weeks: 1 } : "skip"
  );

  const workoutFrequency = useQuery(
    api.analytics.getWorkoutFrequency,
    userId ? { userId, period: frequencyPeriod } : "skip"
  );

  const isLoading = !isLoaded || weeklyVolume === undefined || workoutFrequency === undefined;
  const hasData =
    weeklyVolume !== undefined &&
    workoutFrequency !== undefined &&
    (weeklyVolume.length > 0 || workoutFrequency.total > 0);
  const muscleGroupSets =
    weeklyVolume?.reduce((totals, week) => {
      for (const [group, value] of Object.entries(week.volumes)) {
        const sets = typeof value === "number" ? value : value.sets;
        const bodyPart = toBodyPart(group);
        if (BODY_PARTS.includes(bodyPart as BodyPart)) {
          totals[bodyPart] += sets;
        }
      }
      return totals;
    }, Object.fromEntries(BODY_PARTS.map((part) => [part, 0])) as Record<BodyPart, number>) ??
    (Object.fromEntries(BODY_PARTS.map((part) => [part, 0])) as Record<BodyPart, number>);

  if (isLoaded && !userId) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          icon={User}
          title={t("dashboard.signedOutTitle")}
          description={t("dashboard.signedOutCopy")}
          action={
            <Link href="/sign-in">
              <Button>{t("common.signIn")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("common.analytics")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("analytics.copy")}
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">{t("analytics.loadingCopy")}</p>
      )}

      {!isLoading && !hasData && (
        <EmptyState
          icon={BarChart3}
          title={t("analytics.emptyTitle")}
          description={t("analytics.emptyCopy")}
          action={
            <Link href="/workouts/new">
              <Button className="gap-2">
                <Dumbbell className="h-4 w-4" />
                {t("common.startWorkout")}
              </Button>
            </Link>
          }
        />
      )}

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
            {t("analytics.weeklySets")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 px-3 pb-4 sm:px-6 lg:grid-cols-[240px_1fr] lg:items-center">
          {weeklyVolume === undefined ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <>
              <WorkoutMuscleMap
                muscleGroups={[]}
                muscleGroupSets={muscleGroupSets}
                className="mx-auto w-full max-w-[220px]"
              />
              <VolumeBarChart data={weeklyVolume} />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              {t("analytics.workoutFrequency")}
            </CardTitle>
            {workoutFrequency && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("analytics.totalWorkouts")}: {workoutFrequency.total}
              </p>
            )}
          </div>
          <Tabs
            value={frequencyPeriod}
            onValueChange={(value) => setFrequencyPeriod(value as FrequencyPeriod)}
          >
            <TabsList aria-label={t("analytics.period")}>
              <TabsTrigger value="week">{t("analytics.week")}</TabsTrigger>
              <TabsTrigger value="month">{t("analytics.month")}</TabsTrigger>
              <TabsTrigger value="year">{t("analytics.year")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="px-3 pb-4 sm:px-6">
          {workoutFrequency === undefined ? (
            <Skeleton className="h-[180px] w-full" />
          ) : (
            <WorkoutsPerWeekChart
              data={workoutFrequency}
              period={frequencyPeriod}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
