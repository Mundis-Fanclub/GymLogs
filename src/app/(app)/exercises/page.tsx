"use client";

import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { ExercisesList } from "@/components/exercises/ExercisesList";
import { PageTitle } from "@/components/ui/page-title";

export default function ExercisesPage() {
  const { t } = useAppPreferences();

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title={t("exercises.title")} />
      <ExercisesList />
    </div>
  );
}
