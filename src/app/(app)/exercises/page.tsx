"use client";

import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { ExercisesList } from "@/components/exercises/ExercisesList";
import { PageTitle } from "@/components/ui/page-title";
import { AppPage } from "@/components/ui/app-surface";

export default function ExercisesPage() {
  const { t } = useAppPreferences();

  return (
    <AppPage className="max-w-4xl">
      <PageTitle title={t("exercises.title")} />
      <ExercisesList />
    </AppPage>
  );
}
