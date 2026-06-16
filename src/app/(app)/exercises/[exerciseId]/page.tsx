"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Trophy } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConvexUser } from "@/hooks/useConvexUser";
import { estimated1RM, formatWeight } from "@/lib/pr-utils";

const WeightProgressChart = dynamic(
  () => import("@/components/charts/WeightProgressChart").then((module) => module.WeightProgressChart),
  { ssr: false, loading: () => <Skeleton className="h-[220px] w-full" /> }
);

export default function ExerciseDetailPage() {
  const { exerciseId } = useParams();
  const { userId } = useConvexUser();
  const { locale, t } = useAppPreferences();

  const exercise = useQuery(api.exercises.get, {
    id: exerciseId as Id<"exercises">,
  });

  const history = useQuery(
    api.exercises.getHistory,
    userId
      ? { exerciseId: exerciseId as Id<"exercises">, userId, limit: 20 }
      : "skip"
  );

  const prs = useQuery(
    api.prs.getForExercise,
    userId
      ? { userId, exerciseId: exerciseId as Id<"exercises"> }
      : "skip"
  );

  if (exercise === undefined || history === undefined) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!exercise) {
    return <p className="text-muted-foreground">{t("common.notFoundExercise")}</p>;
  }

  const chartData = (history ?? []).map((session) => {
    const best = session.sets.reduce(
      (max, s) => (s.weight > max.weight ? s : max),
      session.sets[0]
    );
    return {
      date: session.date,
      weight: best?.weight ?? 0,
      e1rm: best
        ? Math.round(estimated1RM(best.weight, best.reps) * 10) / 10
        : 0,
    };
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{exercise.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="capitalize">
              {t(`muscleGroups.${exercise.muscleGroup}`)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {t(`categories.${exercise.category}`)}
            </Badge>
          </div>
        </div>
      </div>

      {prs && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-500" />
              {t("prs.personalRecords")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("prs.heaviest")}</p>
                <p className="text-lg font-bold">
                  {formatWeight(prs.heaviestWeight)} {t("common.kg")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("prs.best1rm")}</p>
                <p className="text-lg font-bold">
                  {formatWeight(prs.best1RM)} {t("common.kg")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("prs.bestVolume")}</p>
                <p className="text-lg font-bold">
                  {formatWeight(prs.highestVolume)} {t("common.kg")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("prs.progress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <WeightProgressChart data={chartData} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("prs.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("prs.noHistory")}
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((session, si) => (
                <div key={si}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    {format(session.date, "EEE, MMM d, yyyy", {
                      locale: locale === "de" ? de : enUS,
                    })}
                  </p>
                  <div className="space-y-1">
                    {session.sets.map((set, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-4">{i + 1}</span>
                        <span className="font-medium">
                          {set.weight} {t("common.kg")}
                        </span>
                        <span className="text-muted-foreground">x</span>
                        <span>
                          {set.reps} {t("common.reps")}
                        </span>
                        {set.rir !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            RIR {set.rir}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
