"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FrequencyPeriod } from "@/components/charts/WorkoutsPerWeekChart";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Dumbbell, TrendingDown, TrendingUp, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutMuscleMap } from "@/components/workout/WorkoutMuscleMap";
import { WorkoutsList } from "@/components/workout/WorkoutsList";
import { ExercisesList } from "@/components/exercises/ExercisesList";
import { cn } from "@/lib/utils";
import {
  BODY_PARTS,
  getWeeklySetVolumeColor,
  type BodyPart,
} from "@/lib/muscle-groups";

const VolumeBarChart = dynamic(
  () => import("@/components/charts/VolumeBarChart").then((mod) => mod.VolumeBarChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[320px] w-full" />,
  }
);

const WorkoutsPerWeekChart = dynamic(
  () =>
    import("@/components/charts/WorkoutsPerWeekChart").then(
      (mod) => mod.WorkoutsPerWeekChart
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[180px] w-full" />,
  }
);

export default function AnalyticsPage() {
  const { userId, isLoaded } = useConvexUser();
  const { t } = useAppPreferences();
  const [frequencyPeriod, setFrequencyPeriod] =
    useState<FrequencyPeriod>("week");
  const hideTabs = useHideOnScrollDown();

  const muscleAnalytics = useQuery(
    api.analytics.getMuscleAnalytics,
    userId ? { userId } : "skip"
  );

  const workoutFrequency = useQuery(
    api.analytics.getWorkoutFrequency,
    userId ? { userId, period: frequencyPeriod } : "skip"
  );

  const isLoading =
    !isLoaded ||
    workoutFrequency === undefined ||
    muscleAnalytics === undefined;
  const hasData =
    workoutFrequency !== undefined &&
    muscleAnalytics !== undefined &&
    (muscleAnalytics.totalSets > 0 || workoutFrequency.total > 0);
  const muscleGroupSets =
    muscleAnalytics?.bodyParts.reduce((totals, part) => {
      totals[part.part as BodyPart] = part.sets;
      return totals;
    }, Object.fromEntries(BODY_PARTS.map((part) => [part, 0])) as Record<BodyPart, number>) ??
    (Object.fromEntries(BODY_PARTS.map((part) => [part, 0])) as Record<BodyPart, number>);
  const weeklyVolume = muscleAnalytics
    ? [
        {
          weekStart: muscleAnalytics.weekStart,
          volumes: Object.fromEntries(
            muscleAnalytics.bodyParts.map((part) => [
              part.part,
              { sets: part.sets, volume: part.volume },
            ])
          ),
        },
      ]
    : [];

  if (isLoaded && !userId) {
    return (
      <div className="mx-auto max-w-3xl">
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
    <div className="mx-auto max-w-5xl">
      <h1 className="sr-only">{t("common.analytics")}</h1>
      <Tabs defaultValue="overview" className="gap-0">
        <div
          className={cn(
            "sticky top-0 z-20 -mx-4 -mt-4 bg-background px-4 pb-3 pt-3 transition-transform duration-200 sm:-mx-5 sm:px-5 md:-mx-6 md:-mt-6 md:px-6 md:pt-4",
            hideTabs && "-translate-y-full"
          )}
        >
          <TabsList className="flex w-full">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="workouts">{t("common.workouts")}</TabsTrigger>
            <TabsTrigger value="exercises">{t("common.exercises")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
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
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <CardTitle className="text-sm font-medium">
                  Wochenanalyse pro Muskelgruppe
                </CardTitle>
                {muscleAnalytics && (
                  <p className="text-xs text-muted-foreground">
                    {muscleAnalytics.totalSets} Sätze · {Math.round(muscleAnalytics.totalVolume).toLocaleString("de-DE")} kg Volumen
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 px-3 pb-4 sm:px-6 xl:grid-cols-[minmax(240px,320px)_1fr] xl:items-start">
              {muscleAnalytics === undefined ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <>
                  <WorkoutMuscleMap
                    muscleGroups={[]}
                    muscleGroupSets={muscleGroupSets}
                    className="mx-auto w-full"
                  />
                  <div className="space-y-4">
                    <VolumeBarChart data={weeklyVolume} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      {muscleAnalytics.bodyParts
                        .filter((part) => part.part !== "other")
                        .map((part) => (
                          <MuscleInsight key={part.part} part={part} />
                        ))}
                    </div>
                  </div>
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
        </TabsContent>

        <TabsContent value="workouts" className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-muted-foreground">{t("workouts.copy")}</p>
            {userId && (
              <Link href="/workouts/new">
                <Button size="sm" className="gap-2">
                  <Dumbbell className="h-4 w-4" />
                  {t("common.startWorkout")}
                </Button>
              </Link>
            )}
          </div>
          <WorkoutsList userId={userId} />
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("exercises.copy")}</p>
          <ExercisesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function useHideOnScrollDown(threshold = 40) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    const getY = () =>
      (main?.scrollTop ?? 0) +
      (window.scrollY || document.documentElement.scrollTop || 0);

    let lastY = getY();
    let raf = 0;

    const handler = () => {
      const y = getY();
      if (y > lastY + 2 && y > threshold) {
        setHidden(true);
      } else if (y < lastY - 2) {
        setHidden(false);
      }
      lastY = y;
      raf = 0;
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(handler);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    main?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      main?.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return hidden;
}

function MuscleInsight({
  part,
}: {
  part: {
    part: BodyPart;
    sets: number;
    volume: number;
    previousSets: number;
    setDelta: number;
    targetMin: number;
    targetMax: number;
    status: string;
    exercises: string[];
  };
}) {
  const label = {
    chest: "Brust",
    back: "Rücken",
    biceps: "Bizeps",
    triceps: "Trizeps",
    core: "Core",
    legs: "Beine",
    glutes: "Glutes",
    shoulders: "Schultern",
    other: "Sonstiges",
  }[part.part];
  const statusText =
    part.status === "missing"
      ? "fehlt diese Woche"
      : part.status === "low"
        ? "unter Zielbereich"
        : part.status === "high"
          ? "sehr viel Volumen"
          : "im Zielbereich";
  const statusClass =
    part.status === "balanced"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : part.status === "high"
        ? "border-amber-500/30 bg-amber-500/10"
        : "border-border bg-muted/30";
  const volumeColor = getWeeklySetVolumeColor(part.sets);

  return (
    <div className={`rounded-lg border p-3 ${statusClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium" style={{ color: volumeColor }}>
            {label}
          </p>
          <p className="text-xs text-muted-foreground">
            Ziel: {part.targetMin}-{part.targetMax} Sätze
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {part.setDelta >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          {part.setDelta > 0 ? "+" : ""}
          {part.setDelta}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold" style={{ color: volumeColor }}>
            {part.sets}
          </p>
          <p className="text-xs text-muted-foreground">{statusText}</p>
        </div>
        <p className="text-right text-xs text-muted-foreground">
          {Math.round(part.volume).toLocaleString("de-DE")} kg
        </p>
      </div>
      {part.exercises.length > 0 && (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {part.exercises.join(", ")}
        </p>
      )}
    </div>
  );
}
