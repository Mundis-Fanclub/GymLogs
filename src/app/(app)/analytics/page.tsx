"use client";

import { useState } from "react";
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
import { AlertTriangle, BarChart3, Dumbbell, TrendingDown, TrendingUp, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutMuscleMap } from "@/components/workout/WorkoutMuscleMap";
import { PageTitle } from "@/components/ui/page-title";
import {
  BODY_PARTS,
  SUB_LEG_PARTS,
  type BodyPart,
} from "@/lib/muscle-groups";
import { cn } from "@/lib/utils";

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
    (muscleAnalytics?.bodyGraphZoneSets as
      | Record<BodyPart, number>
      | undefined) ??
    (Object.fromEntries(BODY_PARTS.map((part) => [part, 0])) as Record<
      BodyPart,
      number
    >);
  const displayBodyParts = muscleAnalytics
    ? aggregateLegsForDisplay(muscleAnalytics.bodyParts).filter(
        (part) => part.part !== "other"
      )
    : [];
  const captionSetCounts = Object.fromEntries(
    displayBodyParts.map((part) => [part.part, part.sets])
  ) as Partial<Record<BodyPart, number>>;
  const overTargetParts = displayBodyParts.filter(
    (part) => part.sets > part.targetMax
  );
  const topFocus = [...displayBodyParts]
    .filter((part) => part.sets > 0)
    .sort((a, b) => b.sets - a.sets)[0];

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
    <div className="mx-auto max-w-5xl space-y-5">
      <PageTitle title={t("common.analytics")} />
      <div className="space-y-5">
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

            {muscleAnalytics === undefined ? (
              <Skeleton className="h-[80px] w-full" />
            ) : (
              <WeeklySummary
                workoutsCount={workoutFrequency?.total ?? 0}
                period={frequencyPeriod}
                totalSets={muscleAnalytics.totalSets}
                totalVolume={muscleAnalytics.totalVolume}
                topFocus={topFocus}
                overTarget={overTargetParts}
              />
            )}

            <Card className="overflow-hidden">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">
                  Körperdiagramm
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Sätze pro Muskelgruppe in dieser Woche
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-5 sm:px-6">
                {muscleAnalytics === undefined ? (
                  <Skeleton className="h-[480px] w-full" />
                ) : (
                  <WorkoutMuscleMap
                    muscleGroups={[]}
                    muscleGroupSets={muscleGroupSets}
                    captionSetCounts={captionSetCounts}
                    exercisesByZone={muscleAnalytics.exercisesByZone}
                    hideHeader
                    className="mx-auto w-full max-w-[540px] border-0 p-0 shadow-none"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Muskelgruppen
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-4 sm:px-6">
                {muscleAnalytics === undefined ? (
                  <Skeleton className="h-[180px] w-full" />
                ) : (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {displayBodyParts.map((part) => (
                      <CompactMuscleCard key={part.part} part={part} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {workoutFrequency === undefined ? (
              <Skeleton className="h-[160px] w-full" />
            ) : workoutFrequency.total > 0 ? (
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {t("analytics.workoutFrequency")}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("analytics.totalWorkouts")}: {workoutFrequency.total}
                    </p>
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
                <CardContent>
                  {workoutFrequency.total === 1 ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Bisher 1 Workout — noch keine regelmäßige Verteilung erkennbar.
                      </p>
                      <WorkoutsPerWeekChart
                        data={workoutFrequency}
                        period={frequencyPeriod}
                        compact
                      />
                    </div>
                  ) : (
                    <WorkoutsPerWeekChart
                      data={workoutFrequency}
                      period={frequencyPeriod}
                    />
                  )}
                </CardContent>
              </Card>
            ) : null}
      </div>
    </div>
  );
}

type BodyPartSummary = {
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

function aggregateLegsForDisplay(
  parts: readonly BodyPartSummary[]
): BodyPartSummary[] {
  const isSubLeg = (p: BodyPartSummary) =>
    (SUB_LEG_PARTS as readonly string[]).includes(p.part);
  const subLegSummaries = parts.filter(isSubLeg);
  if (subLegSummaries.length === 0) return parts.filter((p) => !isSubLeg(p));
  const legsEntry = parts.find((p) => p.part === "legs");
  if (!legsEntry) return parts.filter((p) => !isSubLeg(p));

  const aggSets =
    legsEntry.sets + subLegSummaries.reduce((s, p) => s + p.sets, 0);
  const aggPrev =
    legsEntry.previousSets +
    subLegSummaries.reduce((s, p) => s + p.previousSets, 0);
  const aggVolume =
    legsEntry.volume + subLegSummaries.reduce((s, p) => s + p.volume, 0);
  const aggExercises = [
    ...legsEntry.exercises,
    ...subLegSummaries.flatMap((p) => p.exercises),
  ].slice(0, 5);
  const status =
    aggSets === 0
      ? "missing"
      : aggSets < legsEntry.targetMin
        ? "low"
        : aggSets > legsEntry.targetMax
          ? "high"
          : "balanced";

  const aggregatedLegs: BodyPartSummary = {
    ...legsEntry,
    sets: aggSets,
    previousSets: aggPrev,
    setDelta: aggSets - aggPrev,
    volume: aggVolume,
    exercises: aggExercises,
    status,
  };

  return parts
    .filter((p) => !isSubLeg(p))
    .map((p) => (p.part === "legs" ? aggregatedLegs : p));
}

const BODY_PART_LABELS: Record<BodyPart, string> = {
  chest: "Brust",
  back: "Rücken",
  biceps: "Bizeps",
  triceps: "Trizeps",
  core: "Core",
  legs: "Beine",
  quads: "Quads",
  hamstrings: "Beinbeuger",
  calves: "Waden",
  glutes: "Gesäß",
  shoulders: "Schultern",
  other: "Sonstiges",
};

type LoadStatus = "missing" | "low" | "balanced" | "high" | "very_high";

function loadStatus(part: BodyPartSummary): LoadStatus {
  if (part.sets === 0) return "missing";
  if (part.sets < part.targetMin) return "low";
  if (part.sets > part.targetMax * 1.5) return "very_high";
  if (part.sets > part.targetMax) return "high";
  return "balanced";
}

const STATUS_STYLES: Record<LoadStatus, string> = {
  missing: "border-border bg-muted/30 text-muted-foreground",
  low: "border-info/25 bg-info/10 text-info-foreground",
  balanced: "border-success/30 bg-success/10 text-success-foreground",
  high: "border-warning/30 bg-warning/10 text-warning-foreground",
  very_high: "border-danger/30 bg-danger/10 text-danger-foreground",
};

function CompactMuscleCard({ part }: { part: BodyPartSummary }) {
  const status = loadStatus(part);
  const label = BODY_PART_LABELS[part.part];
  const isInactive = status === "missing";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-opacity",
        STATUS_STYLES[status],
        isInactive && "opacity-60"
      )}
    >
      <span className="truncate font-medium">{label}</span>
      <div className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
        <span className="text-base font-semibold leading-none">
          {part.sets}
        </span>
        <span className="opacity-70">
          / {part.targetMin}–{part.targetMax}
        </span>
        {part.setDelta !== 0 && (
          <span className="inline-flex items-center gap-0.5 opacity-80">
            {part.setDelta > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {part.setDelta > 0 ? "+" : ""}
            {part.setDelta}
          </span>
        )}
      </div>
    </div>
  );
}

const PERIOD_LABELS: Record<FrequencyPeriod, string> = {
  week: "diese Woche",
  month: "diesen Monat",
  year: "dieses Jahr",
};

function WeeklySummary({
  workoutsCount,
  period,
  totalSets,
  totalVolume,
  topFocus,
  overTarget,
}: {
  workoutsCount: number;
  period: FrequencyPeriod;
  totalSets: number;
  totalVolume: number;
  topFocus: BodyPartSummary | undefined;
  overTarget: BodyPartSummary[];
}) {
  const topLabel = topFocus ? BODY_PART_LABELS[topFocus.part] : "—";
  const topSub = topFocus ? `${topFocus.sets} Sätze` : "Noch keine Daten";

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
        <SummaryStat label="Workouts" sub={PERIOD_LABELS[period]} value={workoutsCount} />
        <SummaryStat label="Sätze" sub="diese Woche" value={totalSets} />
        <SummaryStat label="Top-Fokus" sub={topSub} value={topLabel} />
        <SummaryStat
          label="Volumen"
          sub="diese Woche"
          value={`${Math.round(totalVolume).toLocaleString("de-DE")} kg`}
        />
      </CardContent>
      {overTarget.length > 0 && (
        <div className="flex items-start gap-2 border-t border-warning/25 bg-warning/5 px-4 py-2 text-xs text-warning-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold">Über Zielbereich:</span>{" "}
            {overTarget
              .map(
                (part) =>
                  `${BODY_PART_LABELS[part.part]} ${part.sets} / ${part.targetMax} Sätze`
              )
              .join(" · ")}
          </span>
        </div>
      )}
    </Card>
  );
}

function SummaryStat({
  label,
  sub,
  value,
}: {
  label: string;
  sub?: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-lg font-semibold leading-tight sm:text-xl">
        {value}
      </p>
      {sub && <p className="truncate text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
