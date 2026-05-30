"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { api } from "../../../../convex/_generated/api";
import { WeekActivityStrip } from "@/components/dashboard/WeekActivityStrip";
import { useConvexUser } from "@/hooks/useConvexUser";
import { formatVolume } from "@/lib/pr-utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import {
  SUB_LEG_PARTS,
  type BodyPart,
} from "@/lib/muscle-groups";
import { ArrowRight, ChevronRight, Dumbbell, Trophy, User } from "lucide-react";

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

export default function DashboardPage() {
  const { userId, isLoaded } = useConvexUser();
  const { locale, t } = useAppPreferences();

  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId ? { userId } : "skip"
  );
  const muscleAnalytics = useQuery(
    api.analytics.getMuscleAnalytics,
    userId ? { userId } : "skip"
  );
  const workoutFrequency = useQuery(
    api.analytics.getWorkoutFrequency,
    userId ? { userId, period: "week" } : "skip"
  );
  const recentWorkouts = useQuery(
    api.workouts.list,
    userId ? { userId, limit: 3 } : "skip"
  );
  const prSince = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);
  const recentPRs = useQuery(
    api.prs.getRecent,
    userId ? { userId, since: prSince } : "skip"
  );

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-[110px] w-full" />
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-3xl pt-8">
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

  // Aggregate sub-leg muscle groups into "legs" so the top focus matches
  // what the analytics list shows. Done inline here rather than reaching
  // into analytics-page's aggregator to keep the dashboard self-contained.
  const topFocus = (() => {
    if (!muscleAnalytics) return null;
    const isSubLeg = (part: BodyPart) =>
      (SUB_LEG_PARTS as readonly string[]).includes(part);
    const totals = new Map<BodyPart, number>();
    for (const p of muscleAnalytics.bodyParts) {
      if (p.sets === 0 || p.part === "other") continue;
      const key = isSubLeg(p.part as BodyPart) ? ("legs" as BodyPart) : (p.part as BodyPart);
      totals.set(key, (totals.get(key) ?? 0) + p.sets);
    }
    if (totals.size === 0) return null;
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return { part: sorted[0][0], sets: sorted[0][1] };
  })();

  const trainingWeekSubtitle = (() => {
    if (!workoutFrequency) return "Trainingsdaten werden geladen.";
    if (workoutFrequency.total === 0) return "Noch keine Workouts diese Woche.";
    if (workoutFrequency.total === 1) return "Bisher 1 Workout diese Woche.";
    return `Bisher ${workoutFrequency.total} Workouts diese Woche.`;
  })();

  const hasAnyTrainingData =
    (recentWorkouts && recentWorkouts.length > 0) ||
    (workoutFrequency && workoutFrequency.total > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageTitle
        title={t("common.dashboard")}
        action={
          <Link href="/workouts/new">
            <Button className="gap-2">
              <Dumbbell className="h-4 w-4" />
              {t("common.startWorkout")}
            </Button>
          </Link>
        }
      />

      {incompleteWorkout && (
        <Link
          href="/workouts/new"
          className="group flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm transition-colors hover:bg-brand/15"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-brand">
              <Dumbbell className="h-4 w-4" />
            </span>
            <span>
              <span className="font-medium text-brand">
                {t("dashboard.unfinished")}
              </span>
              <span className="ml-1.5 text-muted-foreground">
                {t("dashboard.resume")}
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Trainingswoche */}
      {workoutFrequency === undefined ? (
        <Skeleton className="h-[120px] w-full" />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Trainingswoche
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {trainingWeekSubtitle}
            </p>
          </CardHeader>
          <CardContent>
            <WeekActivityStrip buckets={workoutFrequency.buckets} />
          </CardContent>
        </Card>
      )}

      {/* Empty state if no data anywhere */}
      {recentWorkouts !== undefined &&
      workoutFrequency !== undefined &&
      !hasAnyTrainingData ? (
        <EmptyState
          icon={Dumbbell}
          title={t("dashboard.emptyTitle")}
          description={t("dashboard.emptyCopy")}
          action={
            <Link href="/workouts/new">
              <Button className="gap-2">
                <Dumbbell className="h-4 w-4" />
                {t("common.startWorkout")}
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Compact week stats — 2x2 */}
          <div className="grid grid-cols-2 gap-2.5">
            <CompactStat label="Workouts" value={workoutFrequency?.total ?? 0} />
            <CompactStat label="Sätze" value={muscleAnalytics?.totalSets ?? 0} />
            <CompactStat
              label="Volumen"
              value={
                muscleAnalytics
                  ? `${formatVolume(muscleAnalytics.totalVolume)} kg`
                  : "—"
              }
            />
            <CompactStat
              label="Top-Fokus"
              value={topFocus ? BODY_PART_LABELS[topFocus.part] : "—"}
              sub={topFocus ? `${topFocus.sets} Sätze` : undefined}
            />
          </div>

          {/* Letzte Workouts */}
          <section>
            <div className="mb-2 flex items-end justify-between">
              <h2 className="text-sm font-semibold">Letzte Workouts</h2>
              {recentWorkouts && recentWorkouts.length > 0 && (
                <Link
                  href="/workouts"
                  className="inline-flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Alle anzeigen
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            {recentWorkouts === undefined ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentWorkouts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
                Noch keine Workouts.
              </p>
            ) : (
              <div className="space-y-2">
                {recentWorkouts.map((w) => (
                  <Link
                    key={w._id}
                    href={`/workouts/${w._id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3.5 py-3 text-sm transition-colors hover:bg-accent/30"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {format(w.date, "EEE, dd.MM.", {
                          locale: locale === "de" ? de : enUS,
                        })}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {w.totalSets} Sätze ·{" "}
                        {formatVolume(w.totalVolume)} {t("common.kg")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* PRs — compact summary link */}
          {recentPRs && recentPRs.length > 0 && (
            <Link
              href="/workouts"
              className="flex items-center justify-between gap-3 rounded-lg border border-warning/25 bg-warning/5 px-3.5 py-3 text-sm transition-colors hover:bg-warning/10"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warning/15 text-warning">
                  <Trophy className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium">
                    Neue Bestleistungen: {recentPRs.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    in den letzten 30 Tagen
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}

function CompactStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold leading-tight tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
