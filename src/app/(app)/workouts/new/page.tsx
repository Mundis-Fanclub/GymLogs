"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useConvexUser } from "@/hooks/useConvexUser";
import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User } from "lucide-react";

export default function NewWorkoutPage() {
  const router = useRouter();
  const { userId, isLoaded, isSignedIn } = useConvexUser();
  const { t } = useAppPreferences();
  const [finishedWorkoutId, setFinishedWorkoutId] =
    useState<Id<"workouts"> | null>(null);
  const [canceledWorkoutId, setCanceledWorkoutId] =
    useState<Id<"workouts"> | null>(null);
  const [resettingWorkoutId, setResettingWorkoutId] =
    useState<Id<"workouts"> | null>(null);
  const resetAttemptedRef = useRef<Id<"workouts"> | null>(null);
  const createWorkout = useMutation(api.workouts.create);
  const resetEmptyWorkoutStart = useMutation(api.workouts.resetEmptyStart);
  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    if (finishedWorkoutId) return;
    if (canceledWorkoutId) return;
    if (!isLoaded || !userId) return;
    if (incompleteWorkout === undefined) return; // still loading

    if (!incompleteWorkout) {
      createWorkout({ userId }).then((id) => {
        router.replace(`/workouts/new?id=${id}`);
      });
      return;
    }

    if (resetAttemptedRef.current !== incompleteWorkout._id) {
      resetAttemptedRef.current = incompleteWorkout._id;
      setResettingWorkoutId(incompleteWorkout._id);
      resetEmptyWorkoutStart({ workoutId: incompleteWorkout._id }).finally(() => {
        setResettingWorkoutId((current) =>
          current === incompleteWorkout._id ? null : current
        );
      });
    }
  }, [
    finishedWorkoutId,
    canceledWorkoutId,
    isLoaded,
    userId,
    incompleteWorkout,
    createWorkout,
    resetEmptyWorkoutStart,
    router,
  ]);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="mx-auto max-w-2xl">
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

  if (finishedWorkoutId) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-6">Workout abgeschlossen</h1>
        <ActiveWorkout workoutId={finishedWorkoutId} isFinished />
      </div>
    );
  }

  if (canceledWorkoutId) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (
    !isLoaded ||
    incompleteWorkout === undefined ||
    resettingWorkoutId === incompleteWorkout?._id
  ) {
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
      <h1 className="text-xl font-semibold mb-6">{t("workouts.newTitle")}</h1>
      <ActiveWorkout
        workoutId={incompleteWorkout._id}
        onFinished={setFinishedWorkoutId}
        onCanceled={setCanceledWorkoutId}
      />
    </div>
  );
}
