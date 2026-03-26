"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VolumeBarChart } from "@/components/charts/VolumeBarChart";
import { WorkoutsPerWeekChart } from "@/components/charts/WorkoutsPerWeekChart";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const { userId } = useConvexUser();

  const weeklyVolume = useQuery(
    api.analytics.getWeeklyVolume,
    userId ? { userId, weeks: 8 } : "skip"
  );

  const workoutsPerWeek = useQuery(
    api.analytics.getWorkoutsPerWeek,
    userId ? { userId, weeks: 12 } : "skip"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Weekly Volume by Muscle Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyVolume === undefined ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <VolumeBarChart data={weeklyVolume} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Workouts per Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workoutsPerWeek === undefined ? (
            <Skeleton className="h-[180px] w-full" />
          ) : (
            <WorkoutsPerWeekChart data={workoutsPerWeek} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
