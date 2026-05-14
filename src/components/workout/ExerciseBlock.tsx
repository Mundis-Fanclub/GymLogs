"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQuery } from "convex/react";
import { formatRelative } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { usePRCheck } from "@/hooks/usePRCheck";
import { formatWeight } from "@/lib/pr-utils";
import { SetRow } from "./SetRow";

interface LocalSet {
  id?: Id<"sets">;
  weight: number;
  reps: number;
  rir?: number;
}

interface ExerciseBlockProps {
  workoutId: Id<"workouts">;
  exerciseId: Id<"exercises">;
  exerciseName: string;
  muscleGroup: string;
  userId: Id<"users">;
  onRemove: () => void;
}

export function ExerciseBlock({
  workoutId,
  exerciseId,
  exerciseName,
  muscleGroup,
  userId,
  onRemove,
}: ExerciseBlockProps) {
  const { locale, t } = useAppPreferences();
  const [sets, setSets] = useState<LocalSet[]>([{ weight: 0, reps: 0 }]);
  const [newSetAutoFocus, setNewSetAutoFocus] = useState(0);

  const { check } = usePRCheck(userId, exerciseId);

  const lastPerformance = useQuery(api.sets.getLastPerformance, {
    userId,
    exerciseId,
    currentWorkoutId: workoutId,
  });

  function addSet() {
    const last = sets[sets.length - 1];
    setSets((prev) => [
      ...prev,
      { weight: last?.weight ?? 0, reps: last?.reps ?? 0 },
    ]);
    setNewSetAutoFocus((n) => n + 1);
  }

  function handleSaved(index: number, setId: Id<"sets">) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, id: setId } : s))
    );
  }

  function handleDelete(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  const lastSummary = lastPerformance
    ? `${formatRelative(lastPerformance.date, new Date(), {
        locale: locale === "de" ? de : enUS,
      })} - ${lastPerformance.sets
        .map((s) => `${formatWeight(s.weight)} x ${s.reps}`)
        .join(", ")}`
    : null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-sm">{exerciseName}</h3>
          <span className="text-xs text-muted-foreground capitalize">
            {t(`muscleGroups.${muscleGroup}`)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={`${exerciseName} entfernen`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {lastSummary && (
        <p className="text-xs text-muted-foreground mb-3 bg-muted/40 px-2 py-1.5 rounded">
          {t("workout.last")}: {lastSummary}
        </p>
      )}

      <div className="mb-1">
        <div className="flex items-center gap-2 px-1 mb-1">
          <span className="w-5" />
          <span className="text-xs text-muted-foreground w-24 text-center">
            {t("workout.weight")} ({t("common.kg")})
          </span>
          <span className="w-3" />
          <span className="text-xs text-muted-foreground w-20 text-center">
            {t("common.reps")}
          </span>
          <span className="text-xs text-muted-foreground w-14 text-center">
            RIR
          </span>
        </div>

        {sets.map((set, index) => (
          <SetRow
            key={index}
            setIndex={index}
            setId={set.id}
            workoutId={workoutId}
            exerciseId={exerciseId}
            userId={userId}
            initialWeight={set.weight}
            initialReps={set.reps}
            initialRir={set.rir}
            prCheck={
              set.weight > 0 && set.reps > 0 ? check(set.weight, set.reps) : null
            }
            autoFocus={index === sets.length - 1 && index === newSetAutoFocus}
            onSaved={(id) => handleSaved(index, id)}
            onDelete={() => handleDelete(index)}
            onTabFromRir={() => {
              if (index === sets.length - 1) addSet();
            }}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-1 h-8 text-muted-foreground hover:text-foreground border border-dashed border-border/60 hover:border-border"
        onClick={addSet}
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        {t("workout.addSet")}
      </Button>
    </div>
  );
}
