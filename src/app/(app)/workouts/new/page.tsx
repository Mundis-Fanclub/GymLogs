"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useConvexUser } from "@/hooks/useConvexUser";
import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewWorkoutPage() {
  const router = useRouter();
  const { userId, isLoaded } = useConvexUser();
  const createWorkout = useMutation(api.workouts.create);
  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !userId) return;
    if (incompleteWorkout === undefined) return; // still loading

    if (!incompleteWorkout) {
      createWorkout({ userId }).then((id) => {
        router.replace(`/workouts/new?id=${id}`);
      });
    }
  }, [isLoaded, userId, incompleteWorkout, createWorkout, router]);

  if (!isLoaded || incompleteWorkout === undefined) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!incompleteWorkout) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">New Workout</h1>
      <ActiveWorkout workoutId={incompleteWorkout._id} />
    </div>
  );
}
