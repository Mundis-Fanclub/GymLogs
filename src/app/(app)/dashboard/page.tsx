"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import {
  ArrowRight,
  BarChart2,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  ListChecks,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { WeekActivityStrip } from "@/components/dashboard/WeekActivityStrip";
import { useConvexUser } from "@/hooks/useConvexUser";
import { formatVolume } from "@/lib/pr-utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import {
  AppEmptyPanel,
  AppMetricCard,
  AppPage,
  AppPanel,
  AppSection,
} from "@/components/ui/app-surface";
import { SUB_LEG_PARTS, type BodyPart } from "@/lib/muscle-groups";

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
  const [loadSecondary, setLoadSecondary] = useState(false);

  const muscleAnalytics = useQuery(
    api.analytics.getMuscleAnalytics,
    userId && loadSecondary ? { userId } : "skip"
  );
  const workoutFrequency = useQuery(
    api.analytics.getWorkoutFrequency,
    userId ? { userId, period: "week" } : "skip"
  );
  const recentWorkouts = useQuery(
    api.workouts.list,
    userId && loadSecondary ? { userId, limit: 3 } : "skip"
  );
  const prSince = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);
  const recentPRs = useQuery(
    api.prs.getRecent,
    userId && loadSecondary ? { userId, since: prSince } : "skip"
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setLoadSecondary(true), 120);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!isLoaded) {
    return (
      <AppPage>
        <Skeleton className="h-9 w-40 rounded-2xl" />
        <Skeleton className="h-[180px] w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-44 w-full rounded-2xl" />
      </AppPage>
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

  const topFocus = (() => {
    if (!muscleAnalytics) return null;
    const isSubLeg = (part: BodyPart) =>
      (SUB_LEG_PARTS as readonly string[]).includes(part);
    const totals = new Map<BodyPart, number>();
    for (const p of muscleAnalytics.bodyParts) {
      if (p.sets === 0 || p.part === "other") continue;
      const key = isSubLeg(p.part as BodyPart)
        ? ("legs" as BodyPart)
        : (p.part as BodyPart);
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
    <AppPage>
      <PageTitle title={t("common.dashboard")} className="pb-0" />

      <AppPanel className="overflow-hidden">
        <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,0.95fr)_minmax(14rem,0.75fr)] sm:p-7">
          <div className="min-w-0">
            <p className="mb-3 inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              GymLogs
            </p>
            <h2 className="max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">
              Bereit für dein nächstes Training?
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              Wochenfokus, Workouts und Bestleistungen aus deinen echten Trainingsdaten.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/workouts/new">
                <Button className="gap-2">
                  {t("common.startWorkout")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" className="gap-2">
                  Analyse ansehen
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden min-h-44 rounded-2xl border border-border/70 bg-[radial-gradient(circle_at_35%_30%,var(--brand-soft),transparent_34%),linear-gradient(135deg,var(--card),var(--background))] sm:block" />
        </div>
      </AppPanel>

      {workoutFrequency === undefined ? (
        <Skeleton className="h-[150px] w-full rounded-2xl" />
      ) : (
        <AppPanel className="p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Trainingswoche</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {trainingWeekSubtitle}
              </p>
            </div>
            <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Woche {format(Date.now(), "I", { locale: locale === "de" ? de : enUS })}
            </span>
          </div>
          <WeekActivityStrip buckets={workoutFrequency.buckets} />
        </AppPanel>
      )}

      {recentWorkouts !== undefined &&
      workoutFrequency !== undefined &&
      !hasAnyTrainingData ? (
        <AppEmptyPanel
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
          <div className="grid grid-cols-2 gap-3">
            <AppMetricCard
              icon={Dumbbell}
              label="Workouts"
              value={workoutFrequency?.total ?? 0}
            />
            <AppMetricCard
              icon={ListChecks}
              label="Sätze"
              value={muscleAnalytics?.totalSets ?? 0}
            />
            <AppMetricCard
              icon={BarChart2}
              label="Volumen"
              value={
                muscleAnalytics
                  ? `${formatVolume(muscleAnalytics.totalVolume)} kg`
                  : "-"
              }
            />
            <AppMetricCard
              icon={Target}
              label="Top-Fokus"
              value={topFocus ? BODY_PART_LABELS[topFocus.part] : "-"}
              sub={topFocus ? `${topFocus.sets} Sätze` : undefined}
            />
          </div>

          <AppSection
            title="Letzte Workouts"
            action={
              recentWorkouts && recentWorkouts.length > 0 ? (
                <Link
                  href="/workouts"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Alle anzeigen
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : null
            }
          >
            {recentWorkouts === undefined ? (
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : recentWorkouts.length === 0 ? (
              <AppEmptyPanel
                icon={CalendarDays}
                title="Noch keine Workouts."
                className="py-7"
              />
            ) : (
              <div className="space-y-2.5">
                {recentWorkouts.map((workout) => (
                  <WorkoutRow
                    key={workout._id}
                    href={`/workouts/${workout._id}`}
                    title={format(workout.date, "EEE, dd.MM.", {
                      locale: locale === "de" ? de : enUS,
                    })}
                    subtitle={`${workout.totalSets} Sätze · ${formatVolume(
                      workout.totalVolume
                    )} ${t("common.kg")}`}
                  />
                ))}
              </div>
            )}
          </AppSection>

          {recentPRs && recentPRs.length > 0 && (
            <Link href="/workouts" className="block">
              <AppPanel interactive className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-warning/25 bg-warning/10 text-warning">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        Neue Bestleistungen: {recentPRs.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        in den letzten 30 Tagen
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </AppPanel>
            </Link>
          )}
        </>
      )}
    </AppPage>
  );
}

function WorkoutRow({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="block">
      <AppPanel interactive className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{title}</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </AppPanel>
    </Link>
  );
}
