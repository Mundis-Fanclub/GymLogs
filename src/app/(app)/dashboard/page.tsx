"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { RecentPRs } from "@/components/dashboard/RecentPRs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVolume } from "@/lib/pr-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { userId, isLoaded } = useConvexUser();

  const stats = useQuery(
    api.analytics.getTotalStats,
    userId ? { userId } : "skip"
  );
  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId ? { userId } : "skip"
  );

  if (!isLoaded || !userId) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </div>

      {incompleteWorkout && (
        <Link href="/workouts/new">
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg text-sm hover:bg-primary/15 transition-colors cursor-pointer">
            <AlertCircle className="w-4 h-4 text-primary shrink-0" />
            <span>You have an unfinished workout. <strong>Resume →</strong></span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          title="Total Workouts"
          value={stats?.totalWorkouts ?? "—"}
        />
        <StatsCard
          title="Total Volume"
          value={stats ? formatVolume(stats.totalVolume) + " kg" : "—"}
        />
        <StatsCard
          title="Total Sets"
          value={stats?.totalSets ?? "—"}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Workouts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <RecentWorkouts userId={userId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent PRs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <RecentPRs userId={userId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
