"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  BarChart3,
  Dumbbell,
  ListChecks,
  Target,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AppMetricCard,
  AppPage,
  AppPanel,
  AppSection,
} from "@/components/ui/app-surface";
import { BODY_PARTS, SUB_LEG_PARTS, type BodyPart } from "@/lib/muscle-groups";
import { cn } from "@/lib/utils";

const WorkoutMuscleMap = dynamic(
  () =>
    import("@/components/workout/WorkoutMuscleMap").then(
      (module) => module.WorkoutMuscleMap
    ),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="mx-auto h-[360px] w-full max-w-[540px] rounded-2xl" />
    ),
  }
);

export default function AnalyticsPage() {
  const { userId, isLoaded } = useConvexUser();
  const { t } = useAppPreferences();

  const overview = useQuery(
    api.analytics.getAnalyticsOverview,
    userId ? { userId } : "skip"
  );
  const muscleAnalytics = overview?.muscleAnalytics;
  const workoutFrequency = overview?.workoutFrequency;

  const isLoading = !isLoaded || overview === undefined;
  const hasData = muscleAnalytics !== undefined && muscleAnalytics.totalSets > 0;
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
    <AppPage>
      <PageTitle title={t("common.analytics")} />

      {isLoading && (
        <AppPanel className="p-4 text-sm text-muted-foreground">
          {t("analytics.loadingCopy")}
        </AppPanel>
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
        <Skeleton className="h-[112px] w-full rounded-2xl" />
      ) : (
        <WeeklySummary
          workoutsCount={workoutFrequency?.total ?? 0}
          totalSets={muscleAnalytics.totalSets}
          totalVolume={muscleAnalytics.totalVolume}
          topFocus={topFocus}
          overTarget={overTargetParts}
        />
      )}

      <AppSection
        title="Körperdiagramm"
        description="Sätze pro Muskelgruppe in dieser Woche"
      >
        <AppPanel className="p-4 sm:p-6">
          {muscleAnalytics === undefined ? (
            <Skeleton className="h-[480px] w-full rounded-2xl" />
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
        </AppPanel>
      </AppSection>

      <AppSection title="Muskelgruppen">
        <AppPanel className="p-3 sm:p-5">
          {muscleAnalytics === undefined ? (
            <Skeleton className="h-[180px] w-full rounded-2xl" />
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {displayBodyParts.map((part) => (
                <CompactMuscleCard key={part.part} part={part} />
              ))}
            </div>
          )}
        </AppPanel>
      </AppSection>
    </AppPage>
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
    legsEntry.sets + subLegSummaries.reduce((sum, p) => sum + p.sets, 0);
  const aggPrev =
    legsEntry.previousSets +
    subLegSummaries.reduce((sum, p) => sum + p.previousSets, 0);
  const aggVolume =
    legsEntry.volume + subLegSummaries.reduce((sum, p) => sum + p.volume, 0);
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
        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-opacity",
        STATUS_STYLES[status],
        isInactive && "opacity-60"
      )}
    >
      <span className="truncate font-medium">{label}</span>
      <div className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
        <span className="text-base font-semibold leading-none">{part.sets}</span>
        <span className="opacity-70">
          / {part.targetMin}-{part.targetMax}
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

function WeeklySummary({
  workoutsCount,
  totalSets,
  totalVolume,
  topFocus,
  overTarget,
}: {
  workoutsCount: number;
  totalSets: number;
  totalVolume: number;
  topFocus: BodyPartSummary | undefined;
  overTarget: BodyPartSummary[];
}) {
  const topLabel = topFocus ? BODY_PART_LABELS[topFocus.part] : "-";
  const topSub = topFocus ? `${topFocus.sets} Sätze` : "Noch keine Daten";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AppMetricCard
          icon={Dumbbell}
          label="Workouts"
          sub="diese Woche"
          value={workoutsCount}
        />
        <AppMetricCard
          icon={ListChecks}
          label="Sätze"
          sub="diese Woche"
          value={totalSets}
        />
        <AppMetricCard
          icon={Target}
          label="Top-Fokus"
          sub={topSub}
          value={topLabel}
        />
        <AppMetricCard
          icon={BarChart3}
          label="Volumen"
          sub="diese Woche"
          value={`${Math.round(totalVolume).toLocaleString("de-DE")} kg`}
        />
      </div>
      {overTarget.length > 0 && (
        <AppPanel className="flex items-start gap-2 border-warning/25 bg-warning/5 px-4 py-3 text-xs text-warning-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold">Über Zielbereich:</span>{" "}
            {overTarget
              .map(
                (part) =>
                  `${BODY_PART_LABELS[part.part]} ${part.sets} / ${
                    part.targetMax
                  } Sätze`
              )
              .join(" · ")}
          </span>
        </AppPanel>
      )}
    </div>
  );
}
