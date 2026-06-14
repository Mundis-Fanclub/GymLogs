"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { Dumbbell, User } from "lucide-react";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { WorkoutsList } from "@/components/workout/WorkoutsList";

export default function WorkoutsPage() {
  const { userId, isLoaded } = useConvexUser();
  const { t } = useAppPreferences();

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title={t("workouts.title")}
        action={
          userId ? (
            <Link href="/workouts/new">
              <Button className="gap-2">
                <Dumbbell className="h-4 w-4" />
                {t("common.startWorkout")}
              </Button>
            </Link>
          ) : null
        }
      />

      {isLoaded && !userId ? (
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
      ) : (
        <WorkoutsList userId={userId} />
      )}
    </div>
  );
}
