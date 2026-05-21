"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { RecentPRs } from "@/components/dashboard/RecentPRs";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useConvexUser } from "@/hooks/useConvexUser";
import { FEATURED_LOGS, MVP_EXERCISES, PRICING_PLANS } from "@/lib/product";
import { formatVolume } from "@/lib/pr-utils";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle, Crown, Dumbbell, ShieldCheck, Trophy, User, Video } from "lucide-react";

export default function DashboardPage() {
  const { userId, isLoaded } = useConvexUser();
  const { t } = useAppPreferences();

  const stats = useQuery(
    api.analytics.getTotalStats,
    userId ? { userId } : "skip"
  );
  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId ? { userId } : "skip"
  );

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <h1 className="sr-only">{t("common.dashboard")}</h1>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!userId) {
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

  const hasTrainingData =
    stats !== undefined &&
    (stats.totalWorkouts > 0 || stats.totalSets > 0 || stats.totalVolume > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#111827_0%,#1f2937_48%,#713f12_100%)] text-white ring-0">
        <CardContent className="px-6 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/60">
                {t("dashboard.eyebrow")}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {t("dashboard.headline")}
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/72">
                {t("dashboard.copy")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/workouts/new">
                  <Button className="gap-2 bg-white text-slate-950 hover:bg-white/90">
                    <Dumbbell className="h-4 w-4" />
                    {t("common.startWorkout")}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Video className="h-4 w-4" />
                  {t("dashboard.verifiedFlow")}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                  {t("dashboard.topBenchmark")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{FEATURED_LOGS[0]?.score}</p>
                <p className="text-sm text-white/72">{FEATURED_LOGS[0]?.lift} bench log</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                  {t("dashboard.proPricing")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{PRICING_PLANS[1]?.price}</p>
                <p className="text-sm text-white/72">{t("dashboard.proPricingCopy")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {incompleteWorkout && (
        <Link href="/workouts/new">
          <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm transition-colors hover:bg-primary/15">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {t("dashboard.unfinished")} <strong>{t("dashboard.resume")}</strong>
            </span>
          </div>
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title={t("dashboard.totalWorkouts")}
          value={stats?.totalWorkouts ?? "-"}
          subtitle={t("dashboard.totalWorkoutsSub")}
        />
        <StatsCard
          title={t("common.totalVolume")}
          value={stats ? formatVolume(stats.totalVolume) + " kg" : "-"}
          subtitle={t("dashboard.totalVolumeSub")}
        />
        <StatsCard
          title={t("dashboard.totalSets")}
          value={stats?.totalSets ?? "-"}
          subtitle={t("dashboard.totalSetsSub")}
        />
      </div>

      {stats !== undefined && !hasTrainingData && (
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
      )}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-amber-200 bg-[linear-gradient(180deg,#fffdf5_0%,#fff7ed_100%)]">
          <CardHeader>
            <CardTitle>{t("dashboard.directionTitle")}</CardTitle>
            <CardDescription>
              {t("dashboard.directionCopy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-white/80 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <p className="font-medium">{t("dashboard.phase1")}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("dashboard.phase1Copy")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white/80 p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-600" />
                <p className="font-medium">{t("dashboard.phase2")}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("dashboard.phase2Copy")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white/80 p-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-sky-600" />
                <p className="font-medium">{t("dashboard.phase3")}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("dashboard.phase3Copy")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.monetizationTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="font-medium">{t("dashboard.freeWorks")}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("dashboard.freeWorksCopy")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 p-4">
              <p className="font-medium">{t("dashboard.proSensible")}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("dashboard.proSensibleCopy")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("logsPage.leaderboardTitle")}</CardTitle>
          <CardDescription>{t("logsPage.leaderboardCopy")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 px-4 sm:px-6">
          {FEATURED_LOGS.map((entry) => (
            <div
              key={`${entry.athlete}-${entry.rank}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-3 sm:px-4"
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                  #{entry.rank}
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-medium">{entry.athlete}</p>
                    <Badge variant={entry.status === "verified" ? "default" : "secondary"}>
                      {entry.status === "verified"
                        ? t("common.verified")
                        : t("common.pendingReview")}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {entry.exercise} / {entry.lift} / {entry.bodyweightClass}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-semibold">{entry.score}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t("common.logScore")}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.recentWorkouts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <RecentWorkouts userId={userId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.recentPRs")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <RecentPRs userId={userId} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("logsPage.exercisePoolTitle")}</CardTitle>
          <CardDescription>{t("logsPage.exercisePoolCopy")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {MVP_EXERCISES.map((exercise) => (
            <Badge key={exercise} variant="secondary" className="rounded-full px-3 py-1">
              {exercise}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
