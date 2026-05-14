"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Timer, Trash2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { usePRCheck } from "@/hooks/usePRCheck";
import { SetRow } from "./SetRow";

interface LocalSet {
  id?: Id<"sets">;
  weight: number;
  reps: number;
}

interface InitialSet {
  id: Id<"sets">;
  weight: number;
  reps: number;
  setOrder: number;
}

interface ExerciseBlockProps {
  workoutId: Id<"workouts">;
  exerciseId: Id<"exercises">;
  exerciseName: string;
  muscleGroup: string;
  userId: Id<"users">;
  initialSets?: InitialSet[];
  onRemove: () => void;
}

export function ExerciseBlock({
  workoutId,
  exerciseId,
  exerciseName,
  userId,
  initialSets,
  onRemove,
}: ExerciseBlockProps) {
  const { t } = useAppPreferences();
  const [sets, setSets] = useState<LocalSet[]>(() => {
    if (!initialSets?.length) return [{ weight: 0, reps: 0 }];
    return [...initialSets]
      .sort((a, b) => a.setOrder - b.setOrder)
      .map((set) => ({
        id: set.id,
        weight: set.weight,
        reps: set.reps,
      }));
  });
  const [newSetAutoFocus, setNewSetAutoFocus] = useState(0);
  const [restSeconds, setRestSeconds] = useState(120);
  const [remainingRest, setRemainingRest] = useState(0);

  const { check } = usePRCheck(userId, exerciseId);

  const lastPerformance = useQuery(api.sets.getLastPerformance, {
    userId,
    exerciseId,
    currentWorkoutId: workoutId,
  });

  useEffect(() => {
    if (remainingRest <= 0) return;
    const interval = window.setInterval(() => {
      setRemainingRest((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [remainingRest]);

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

  function adjustRest(delta: number) {
    if (remainingRest > 0) {
      setRemainingRest((seconds) => Math.max(0, Math.min(600, seconds + delta)));
      return;
    }

    setRestSeconds((seconds) => Math.max(30, Math.min(600, seconds + delta)));
  }

  function formatRest(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${rest.toString().padStart(2, "0")}`;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-sky-500">
            {exerciseName}
          </h3>
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border/70 bg-muted/30 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 text-sm">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {remainingRest > 0 ? formatRest(remainingRest) : formatRest(restSeconds)}
          </span>
          <span className="text-xs text-muted-foreground">
            {remainingRest > 0 ? t("workout.restRunning") : t("workout.rest")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => adjustRest(-15)}
            aria-label={t("workout.decreaseRest")}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => adjustRest(15)}
            aria-label={t("workout.increaseRest")}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="px-2 py-2 sm:px-3">
        <div className="grid grid-cols-[2.25rem_minmax(5.5rem,1fr)_4.75rem_3.75rem_2.25rem_2rem] items-center gap-1.5 border-b border-border/70 px-1 pb-1 text-xs font-semibold text-foreground">
          <span>{t("workout.set")}</span>
          <span>{t("workout.previous")}</span>
          <span className="text-center">{t("common.kg")}</span>
          <span className="text-center">{t("common.reps")}</span>
          <span className="text-center">✓</span>
          <span />
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
            previousSet={lastPerformance?.sets[index]}
            prCheck={
              set.weight > 0 && set.reps > 0 ? check(set.weight, set.reps) : null
            }
            autoFocus={index === sets.length - 1 && index === newSetAutoFocus}
            onSaved={(id) => handleSaved(index, id)}
            onDelete={() => handleDelete(index)}
            onComplete={(completed) => {
              if (!completed) return;
              setRemainingRest(restSeconds);
              if (index === sets.length - 1) addSet();
            }}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mx-3 mb-3 mt-1 h-8 w-[calc(100%-1.5rem)] bg-muted/60 text-foreground hover:bg-muted"
        onClick={addSet}
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        {t("workout.addSet")}
      </Button>
    </div>
  );
}
