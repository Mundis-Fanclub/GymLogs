"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { ExercisesList } from "@/components/exercises/ExercisesList";

export default function ExercisesPage() {
  const { t } = useAppPreferences();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 space-y-3 sm:mb-6 sm:space-y-4">
        <div>
          <h1 className="text-xl font-semibold">{t("exercises.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("exercises.copy")}</p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium">{t("exercises.poolTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("exercises.poolCopy")}</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              <Trophy className="h-4 w-4" />
              Logs
            </Link>
          </CardContent>
        </Card>
      </div>

      <ExercisesList />
    </div>
  );
}
