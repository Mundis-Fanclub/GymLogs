"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
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
      <h1 className="text-xl font-semibold mb-6">{t("workouts.newTitle")}</h1>
      <ActiveWorkout workoutId={incompleteWorkout._id} />
    </div>
  );
}
