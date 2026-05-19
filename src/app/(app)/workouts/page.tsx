"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Trophy, User } from "lucide-react";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { WorkoutsList } from "@/components/workout/WorkoutsList";

export default function WorkoutsPage() {
  const { userId, isLoaded } = useConvexUser();
  const { t } = useAppPreferences();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{t("workouts.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("workouts.copy")}</p>
          </div>
          {userId && (
            <Link href="/workouts/new">
              <Button size="sm" className="gap-2">
                <Dumbbell className="h-4 w-4" />
                {t("common.startWorkout")}
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("workouts.logWorthyTitle")}</CardTitle>
            <CardDescription>{t("workouts.logWorthyCopy")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <Trophy className="h-4 w-4" />
                {t("common.viewLogs")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

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
