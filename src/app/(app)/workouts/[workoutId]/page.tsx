"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVolume } from "@/lib/pr-utils";

export default function WorkoutDetailPage() {
  const { workoutId } = useParams();
  const workout = useQuery(api.workouts.get, {
    workoutId: workoutId as Id<"workouts">,
  });

  if (workout === undefined) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!workout) {
    return <p className="text-muted-foreground">Workout not found.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {format(workout.date, "EEEE, MMMM d")}
        </h1>
        <p className="text-sm text-muted-foreground">
          Total volume: {formatVolume(workout.totalVolume)} kg
        </p>
      </div>

      {workout.notes && (
        <p className="text-sm text-muted-foreground bg-muted/40 px-3 py-2 rounded">
          {workout.notes}
        </p>
      )}

      <div className="space-y-3">
        {workout.exercises.map((ex) => {
          if (!ex.exercise) return null;
          const volume = ex.sets.reduce(
            (sum, s) => sum + s.weight * s.reps,
            0
          );
          return (
            <Card key={ex.exerciseId}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {ex.exercise.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {ex.exercise.muscleGroup.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-1">
                  {ex.sets.map((set, i) => (
                    <div
                      key={set._id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-muted-foreground w-4">
                        {i + 1}
                      </span>
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
                <p className="text-xs text-muted-foreground mt-2">
                  Volume: {formatVolume(volume)} kg
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
