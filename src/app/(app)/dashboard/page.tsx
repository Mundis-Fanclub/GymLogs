"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { RecentPRs } from "@/components/dashboard/RecentPRs";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { StatsCard } from "@/components/dashboard/StatsCard";
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
import { ArrowRight, Dumbbell, User } from "lucide-react";

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
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
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

  const hasTrainingData =
    stats !== undefined &&
    (stats.totalWorkouts > 0 || stats.totalSets > 0 || stats.totalVolume > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
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

      {hasTrainingData ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatsCard
              title={t("dashboard.totalWorkouts")}
              value={stats?.totalWorkouts ?? 0}
              subtitle={t("dashboard.totalWorkoutsSub")}
            />
            <StatsCard
              title={t("common.totalVolume")}
              value={stats ? formatVolume(stats.totalVolume) + " kg" : "—"}
              subtitle={t("dashboard.totalVolumeSub")}
            />
            <StatsCard
              title={t("dashboard.totalSets")}
              value={stats?.totalSets ?? 0}
              subtitle={t("dashboard.totalSetsSub")}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  {t("dashboard.recentWorkouts")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentWorkouts userId={userId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  {t("dashboard.recentPRs")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentPRs userId={userId} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
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
    </div>
  );
}
