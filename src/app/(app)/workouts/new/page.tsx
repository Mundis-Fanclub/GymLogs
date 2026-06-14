"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft, Dumbbell, Play, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function NewWorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <NewWorkoutPageContent />
    </Suspense>
  );
}

function NewWorkoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, isLoaded, isSignedIn } = useConvexUser();
  const { t } = useAppPreferences();
  const templateId = searchParams.get("templateId") as Id<"workout_templates"> | null;
  const workoutIdParam = searchParams.get("id") as Id<"workouts"> | null;
  const [finishedWorkoutId, setFinishedWorkoutId] =
    useState<Id<"workouts"> | null>(null);
  const [canceledWorkoutId, setCanceledWorkoutId] =
    useState<Id<"workouts"> | null>(null);
  const [resettingWorkoutId, setResettingWorkoutId] =
    useState<Id<"workouts"> | null>(null);
  const resetAttemptedRef = useRef<Id<"workouts"> | null>(null);
  const createWorkout = useMutation(api.workouts.create);
  const resetEmptyWorkoutStart = useMutation(api.workouts.resetEmptyStart);
  const startFromTemplate = useMutation(api.workouts.startFromTemplate);
  const incompleteWorkout = useQuery(
    api.workouts.getIncomplete,
    userId && !templateId && !workoutIdParam ? { userId } : "skip"
  );
  const selectedWorkout = useQuery(
    api.workouts.get,
    workoutIdParam ? { workoutId: workoutIdParam } : "skip"
  );
  const startTemplate = useQuery(
    api.workouts.getTemplateForStart,
    userId && templateId ? { viewerId: userId, templateId } : "skip"
  );

  useEffect(() => {
    if (templateId || workoutIdParam) return;
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
    templateId,
    workoutIdParam,
  ]);

  async function confirmTemplateStart() {
    if (!userId || !templateId) return;
    const workoutId = await startFromTemplate({ userId, templateId });
    router.replace(`/workouts/new?id=${workoutId}`);
  }

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

  if (templateId) {
    if (!userId || startTemplate === undefined) {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }

    if (!startTemplate) {
      return (
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={Dumbbell}
            title={t("workouts.templateStartUnavailableTitle")}
            description={t("workouts.templateStartUnavailableCopy")}
            action={
              <Link href="/workouts">
                <Button>{t("workouts.backToWorkouts")}</Button>
              </Link>
            }
          />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" className="gap-2 px-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          {t("profile.misc.back")}
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              {t("workouts.confirmTemplateStartTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{startTemplate.name}</h1>
              {startTemplate.description && (
                <p className="mt-2 text-sm text-muted-foreground">{startTemplate.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {startTemplate.totalExercises} {t("profile.playlists.exercises")}
                </Badge>
                <Badge variant="secondary">
                  {startTemplate.totalSets} {t("common.sets")}
                </Badge>
                <Badge variant="outline">
                  {startTemplate.executionCount} {t("profile.playlists.performedCount")}
                </Badge>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("workouts.confirmTemplateStartCopy")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button className="gap-2" onClick={confirmTemplateStart}>
                <Play className="h-4 w-4" />
                {t("workouts.startFromTemplate")}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                {t("profile.misc.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (workoutIdParam) {
    if (selectedWorkout === undefined) {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }

    if (!selectedWorkout) {
      return (
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={Dumbbell}
            title={t("common.notFoundWorkout")}
            description={t("workouts.templateStartUnavailableCopy")}
          />
        </div>
      );
    }

    return (
      <ActiveWorkout
        workoutId={selectedWorkout._id}
        onFinished={setFinishedWorkoutId}
        onCanceled={setCanceledWorkoutId}
      />
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
    <ActiveWorkout
      workoutId={incompleteWorkout._id}
      onFinished={setFinishedWorkoutId}
      onCanceled={setCanceledWorkoutId}
    />
  );
}
