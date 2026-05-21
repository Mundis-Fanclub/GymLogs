"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { Search, Trophy } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  filterDefaultExercises,
  type DefaultExercise,
} from "@/lib/default-exercises";
import { BODY_PARTS, toBodyPart, type BodyPart } from "@/lib/muscle-groups";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

export function ExercisesList() {
  const [query, setQuery] = useState("");
  const { t } = useAppPreferences();

  const exercises = useQuery(api.exercises.search, { query, limit: 100 });
  type ConvexExercise = NonNullable<typeof exercises>[number];
  const displayExercises: Array<ConvexExercise | DefaultExercise> =
    exercises && exercises.length > 0 ? exercises : filterDefaultExercises(query);
  const isFallback = exercises === undefined || exercises.length === 0;

  const grouped = displayExercises.reduce(
    (acc, ex) => {
      const group = toBodyPart(ex.muscleGroup);
      if (!acc[group]) acc[group] = [];
      acc[group].push(ex);
      return acc;
    },
    {} as Record<BodyPart, Array<ConvexExercise | DefaultExercise>>
  );

  return (
    <div className="space-y-5">
      <div className="sticky top-3 z-10 rounded-lg bg-background/95 pb-2 backdrop-blur md:static md:bg-transparent md:pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("exercises.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isFallback && (
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          {t("exercises.fallbackNotice")}
        </p>
      )}

      {displayExercises.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("exercises.noExercises")}
        </p>
      ) : (
        <div className="space-y-6">
          {BODY_PARTS.filter((mg) => grouped[mg]?.length).map((mg) => (
            <div key={mg}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(`muscleGroups.${mg}`)}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {grouped[mg]?.map((ex) => {
                  const content = (
                    <>
                      <span className="min-w-0 truncate font-medium">{ex.name}</span>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                        {ex.isLeaderboardLift && (
                          <Badge variant="default" className="gap-1 text-xs">
                            <Trophy className="h-3 w-3" />
                            Logs
                          </Badge>
                        )}
                        {ex.isCustom && (
                          <Badge variant="outline" className="text-xs">
                            {t("exercises.custom")}
                          </Badge>
                        )}
                        {"isFallback" in ex && ex.isFallback && (
                          <Badge variant="outline" className="text-xs">
                            Demo
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs capitalize">
                          {t(`muscleGroups.${toBodyPart(ex.muscleGroup)}`)}
                        </Badge>
                      </div>
                    </>
                  );

                  if ("isFallback" in ex && ex.isFallback) {
                    return (
                      <div
                        key={ex._id}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 text-sm"
                      >
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={ex._id}
                      href={`/exercises/${ex._id}`}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 text-sm transition-colors hover:bg-accent/50"
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
