"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { User } from "lucide-react";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { WorkoutsList } from "@/components/workout/WorkoutsList";
import { AppPage } from "@/components/ui/app-surface";

export default function WorkoutsPage() {
  const { userId, isLoaded } = useConvexUser();
  const { t } = useAppPreferences();

  return (
    <AppPage className="max-w-3xl">
      <PageTitle title={t("workouts.title")} />

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
    </AppPage>
  );
}
