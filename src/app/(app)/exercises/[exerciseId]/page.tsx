"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WeightProgressChart } from "@/components/charts/WeightProgressChart";
import { PRBadge } from "@/components/pr/PRBadge";
import { format } from "date-fns";
import { estimated1RM, formatWeight } from "@/lib/pr-utils";
import { Trophy } from "lucide-react";

export default function ExerciseDetailPage() {
  const { exerciseId } = useParams();
  const { userId } = useConvexUser();

  const exercise = useQuery(api.exercises.get, {
    id: exerciseId as Id<"exercises">,
  });

  const history = useQuery(
    api.exercises.getHistory,
    userId
      ? { exerciseId: exerciseId as Id<"exercises">, userId, limit: 20 }
      : "skip"
  );

  const prs = useQuery(
    api.prs.getForExercise,
    userId
      ? { userId, exerciseId: exerciseId as Id<"exercises"> }
      : "skip"
  );

  if (exercise === undefined || history === undefined) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!exercise) {
    return <p className="text-muted-foreground">Exercise not found.</p>;
  }

  // Build chart data: best weight per session
  const chartData = (history ?? []).map((session) => {
    const best = session.sets.reduce(
      (max, s) => (s.weight > max.weight ? s : max),
      session.sets[0]
    );
    return {
      date: session.date,
      weight: best?.weight ?? 0,
      e1rm: best ? Math.round(estimated1RM(best.weight, best.reps) * 10) / 10 : 0,
    };
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{exercise.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="capitalize">
              {exercise.muscleGroup.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {exercise.category}
            </Badge>
          </div>
        </div>
      </div>

      {prs && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Heaviest</p>
                <p className="text-lg font-bold">{formatWeight(prs.heaviestWeight)} kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best 1RM</p>
                <p className="text-lg font-bold">{formatWeight(prs.best1RM)} kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best Volume</p>
                <p className="text-lg font-bold">{formatWeight(prs.highestVolume)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <WeightProgressChart data={chartData} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">History</CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No history yet
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((session, si) => (
                <div key={si}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    {format(session.date, "EEE, MMM d, yyyy")}
                  </p>
                  <div className="space-y-1">
                    {session.sets.map((set, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-4">{i + 1}</span>
                        <span className="font-medium">{set.weight} kg</span>
                        <span className="text-muted-foreground">×</span>
                        <span>{set.reps} reps</span>
                        {set.rir !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            RIR {set.rir}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
