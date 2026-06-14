"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { formatWeight, type PRCheck } from "@/lib/pr-utils";
import { cn } from "@/lib/utils";

type PreviousSet = {
  weight: number;
  reps: number;
};

interface SetRowProps {
  setIndex: number;
  setId?: Id<"sets">;
  workoutId: Id<"workouts">;
  exerciseId: Id<"exercises">;
  userId: Id<"users">;
  initialWeight: number;
  initialReps: number;
  initialNotes?: string;
  initialRestSeconds?: number;
  defaultRestSeconds: number;
  previousSet?: PreviousSet;
  prCheck: PRCheck | null;
  weightUnit?: "kg" | "lb";
  autoFocus?: boolean;
  onSaved?: (
    setId: Id<"sets">,
    data: { weight: number; reps: number; notes?: string; restSeconds: number }
  ) => void;
  onDelete?: () => void;
  onComplete?: (data: {
    completed: boolean;
    setId?: Id<"sets">;
    restSeconds: number;
  }) => void;
}

export function SetRow({
  setIndex,
  setId,
  workoutId,
  exerciseId,
  userId,
  initialWeight,
  initialReps,
  initialNotes,
  initialRestSeconds,
  defaultRestSeconds,
  previousSet,
  weightUnit = "kg",
  autoFocus,
  onSaved,
  onComplete,
}: SetRowProps) {
  const { t } = useAppPreferences();
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [notes] = useState(initialNotes ?? "");
  const [restSeconds, setRestSeconds] = useState(
    initialRestSeconds ?? defaultRestSeconds
  );
  const [currentSetId, setCurrentSetId] = useState(setId);
  const [completed, setCompleted] = useState(Boolean(setId));

  const weightRef = useRef<HTMLInputElement>(null);
  const addSet = useMutation(api.sets.add);
  const updateSet = useMutation(api.sets.update);

  useEffect(() => {
    if (autoFocus) weightRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!setId) return;
    setCurrentSetId(setId);
  }, [setId]);

  useEffect(() => {
    setRestSeconds(initialRestSeconds ?? defaultRestSeconds);
  }, [defaultRestSeconds, initialRestSeconds]);

  async function save(): Promise<Id<"sets"> | undefined> {
    if (weight <= 0 || reps <= 0) return currentSetId;

    if (currentSetId) {
      await updateSet({ setId: currentSetId, weight, reps, notes, restSeconds });
      onSaved?.(currentSetId, { weight, reps, notes, restSeconds });
      return currentSetId;
    }

    const id = await addSet({
      workoutId,
      exerciseId,
      userId,
      weight,
      reps,
      notes,
      restSeconds,
      setOrder: setIndex,
    });
    setCurrentSetId(id);
    onSaved?.(id, { weight, reps, notes, restSeconds });
    return id;
  }

  async function handleComplete() {
    if (completed) {
      setCompleted(false);
      onComplete?.({ completed: false, setId: currentSetId, restSeconds });
      return;
    }

    if (weight <= 0 || reps <= 0) return;
    setCompleted(true);
    onComplete?.({ completed: true, setId: currentSetId, restSeconds });
    const id = await save();
    onComplete?.({ completed: true, setId: id, restSeconds });
  }

  const previousLabel = previousSet
    ? `${formatDisplayWeight(previousSet.weight, weightUnit)} ${weightUnit} x ${previousSet.reps}`
    : "-";
  const weightValue =
    weight > 0 ? formatInputWeight(convertWeightFromKg(weight, weightUnit)) : "";
  const isDropSet = notes.toLowerCase().includes("dropsatz");

  return (
    <div className="grid min-h-11 grid-cols-[2.5rem_minmax(4.25rem,1fr)_4.5rem_4.5rem_2.25rem] items-center gap-1.5 px-1 py-1 text-sm">
      <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/40 font-semibold text-brand">
        {isDropSet ? "D" : setIndex + 1}
      </span>

      <span className="min-w-0 truncate text-center text-muted-foreground">
        {previousLabel}
      </span>

      <Input
        ref={weightRef}
        type="number"
        value={weightValue}
        onChange={(event) =>
          setWeight(convertWeightToKg(parseFloat(event.target.value) || 0, weightUnit))
        }
        onBlur={save}
        className="h-9 rounded-lg border-border bg-input/30 text-center text-sm font-medium"
        placeholder={weightUnit}
        aria-label={`${t("workout.weight")} ${setIndex + 1}`}
        step={weightUnit === "kg" ? 2.5 : 5}
        min={0}
      />

      <Input
        type="number"
        value={reps || ""}
        onChange={(event) => setReps(parseInt(event.target.value) || 0)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") void handleComplete();
        }}
        className="h-9 rounded-lg border-border bg-input/30 text-center text-sm font-medium"
        placeholder={t("common.reps")}
        aria-label={`${t("common.reps")} ${setIndex + 1}`}
        min={0}
      />

      <Button
        type="button"
        variant={completed ? "default" : "outline"}
        size="icon-sm"
        className={cn(
          "size-8 justify-self-center rounded-lg",
          completed
            ? "bg-brand text-brand-foreground hover:bg-brand/90"
            : "border-muted-foreground/50 bg-transparent text-muted-foreground"
        )}
        onClick={handleComplete}
        aria-label={`Set ${setIndex + 1} ${t("workout.completeSet")}`}
      >
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}

function convertWeightFromKg(weight: number, unit: "kg" | "lb") {
  return unit === "kg" ? weight : weight * 2.20462;
}

function convertWeightToKg(weight: number, unit: "kg" | "lb") {
  return unit === "kg" ? weight : weight / 2.20462;
}

function formatDisplayWeight(weight: number, unit: "kg" | "lb") {
  return formatWeight(convertWeightFromKg(weight, unit));
}

function formatInputWeight(weight: number) {
  const rounded = Math.round(weight * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
