"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { api } from "../../../../convex/_generated/api";
import { WeekActivityStrip } from "@/components/dashboard/WeekActivityStrip";
import { useConvexUser } from "@/hooks/useConvexUser";
import { formatVolume } from "@/lib/pr-utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { SUB_LEG_PARTS, type BodyPart } from "@/lib/muscle-groups";
import { Bell, ChevronRight, Dumbbell, Trophy, User } from "lucide-react";

const BODY_PART_LABELS: Record<BodyPart, string> = {
  chest: "Brust",
  back: "Ruecken",
  biceps: "Bizeps",
  triceps: "Trizeps",
  core: "Core",
  legs: "Beine",
  quads: "Quads",
  hamstrings: "Beinbeuger",
  calves: "Waden",
  glutes: "Gesaess",
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
      <div className="space-y-3">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-[104px] w-full" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="pt-8">
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

  const topFocus = (() => {
    if (!muscleAnalytics) return null;
    const isSubLeg = (part: BodyPart) =>
      (SUB_LEG_PARTS as readonly string[]).includes(part);
    const totals = new Map<BodyPart, number>();
    for (const part of muscleAnalytics.bodyParts) {
      if (part.sets === 0 || part.part === "other") continue;
      const key = isSubLeg(part.part as BodyPart)
        ? ("legs" as BodyPart)
        : (part.part as BodyPart);
      totals.set(key, (totals.get(key) ?? 0) + part.sets);
    }
    const [part, sets] = [...totals.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
    return part ? { part, sets } : null;
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
    <div className="space-y-3">
      <PageTitle title={t("common.dashboard")} srOnly />

      <header className="flex h-8 items-center justify-between">
        <h1 className="text-[11px] font-semibold uppercase tracking-normal">
          Dashboard
        </h1>
        <button
          type="button"
          aria-label="Notifications"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
        </button>
      </header>

      <section className="premium-panel relative min-h-[104px] overflow-hidden rounded-xl p-3">
        <div className="absolute inset-y-0 right-0 w-[48%]">
          <Image
            src="/brand/gym-hero.png"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="180px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[12rem]">
          <h2 className="text-lg font-semibold leading-tight">
            Bereit fuer dein naechstes <span className="text-brand">Level?</span>
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
            Wochenfokus, Workouts und Bestleistungen.
          </p>
        </div>
      </section>

      {incompleteWorkout && (
        <Link
          href="/workouts/new"
          className="group flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-xs transition-colors hover:bg-brand/15"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-brand">
              <Dumbbell className="h-3.5 w-3.5" />
            </span>
            <span>
              <span className="font-medium text-brand">
                {t("dashboard.unfinished")}
              </span>
              <span className="ml-1 text-muted-foreground">
                {t("dashboard.resume")}
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {workoutFrequency === undefined ? (
        <Skeleton className="h-[118px] w-full" />
      ) : (
        <Card>
          <CardHeader className="pb-1.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xs font-semibold">Trainingswoche</CardTitle>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {trainingWeekSubtitle}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground">Woche 24</span>
            </div>
          </CardHeader>
          <CardContent>
            <WeekActivityStrip buckets={workoutFrequency.buckets} />
          </CardContent>
        </Card>
      )}

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
          <div className="grid grid-cols-2 gap-2">
            <CompactStat label="Workouts" value={workoutFrequency?.total ?? 0} />
            <CompactStat label="Saetze" value={muscleAnalytics?.totalSets ?? 0} />
            <CompactStat
              label="Volumen"
              value={
                muscleAnalytics
                  ? `${formatVolume(muscleAnalytics.totalVolume)} kg`
                  : "-"
              }
            />
            <CompactStat
              label="Top-Fokus"
              value={topFocus ? BODY_PART_LABELS[topFocus.part] : "-"}
              sub={topFocus ? `${topFocus.sets} Saetze` : undefined}
            />
          </div>

          <section>
            <div className="mb-2 flex items-end justify-between">
              <h2 className="text-xs font-semibold">Letzte Workouts</h2>
              {recentWorkouts && recentWorkouts.length > 0 && (
                <Link
                  href="/workouts"
                  className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
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
                {recentWorkouts.map((workout) => (
                  <Link
                    key={workout._id}
                    href={`/workouts/${workout._id}`}
                    className="premium-panel group grid min-h-[58px] grid-cols-[minmax(0,1fr)_58px_18px] items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:border-brand/30"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">
                        {format(workout.date, "EEE, dd.MM.", {
                          locale: locale === "de" ? de : enUS,
                        })}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {workout.totalSets} Saetze · {formatVolume(workout.totalVolume)} {t("common.kg")}
                      </p>
                    </div>
                    <span className="relative h-12 overflow-hidden rounded-lg">
                      <Image
                        src="/brand/playlist-hero.png"
                        alt=""
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="58px"
                      />
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {recentPRs && recentPRs.length > 0 && (
            <Link
              href="/workouts"
              className="flex items-center justify-between gap-3 rounded-xl border border-warning/25 bg-warning/5 px-3 py-2 text-xs transition-colors hover:bg-warning/10"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warning/15 text-warning">
                  <Trophy className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-medium">Neue Bestleistungen: {recentPRs.length}</p>
                  <p className="text-[10px] text-muted-foreground">in den letzten 30 Tagen</p>
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
    <div className="premium-panel rounded-xl px-3 py-2.5">
      <p className="text-[9px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold leading-tight tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
