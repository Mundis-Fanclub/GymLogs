"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { Search, Trophy } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppEmptyPanel, AppSection } from "@/components/ui/app-surface";
import {
  filterDefaultExercises,
  type DefaultExercise,
} from "@/lib/default-exercises";
import {
  DISPLAY_BODY_PARTS,
  toBodyPart,
  toDisplayBodyPart,
  type DisplayBodyPart,
} from "@/lib/muscle-groups";
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
      const group = toDisplayBodyPart(toBodyPart(ex.muscleGroup));
      if (!acc[group]) acc[group] = [];
      acc[group].push(ex);
      return acc;
    },
    {} as Record<DisplayBodyPart, Array<ConvexExercise | DefaultExercise>>
  );

  return (
    <div className="space-y-5">
      <div className="sticky top-3 z-10 rounded-2xl bg-background/95 pb-2 backdrop-blur md:static md:bg-transparent md:pb-0">
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
        <p className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          {t("exercises.fallbackNotice")}
        </p>
      )}

      {displayExercises.length === 0 ? (
        <AppEmptyPanel title={t("exercises.noExercises")} className="py-10" />
      ) : (
        <div className="space-y-6">
          {DISPLAY_BODY_PARTS.filter((mg) => grouped[mg]?.length).map((mg) => (
            <AppSection key={mg} title={t(`muscleGroups.${mg}`)}>
              <div className="grid gap-2 sm:grid-cols-2">
                {grouped[mg]?.map((ex) => {
                  const content = (
                    <>
                      <span className="min-w-0 truncate font-medium">{ex.name}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
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
                      </div>
                    </>
                  );

                  if ("isFallback" in ex && ex.isFallback) {
                    return (
                      <div
                        key={ex._id}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/55 px-3 py-2.5 text-sm"
                      >
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={ex._id}
                      href={`/exercises/${ex._id}`}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/55 px-3 py-2.5 text-sm transition-colors hover:bg-accent/50"
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </AppSection>
          ))}
        </div>
      )}
    </div>
  );
}
