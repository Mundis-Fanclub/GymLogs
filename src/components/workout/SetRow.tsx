"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, TrendingUp, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { estimated1RM, formatWeight, type PRCheck } from "@/lib/pr-utils";

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
  previousSet?: PreviousSet;
  prCheck: PRCheck | null;
  autoFocus?: boolean;
  onSaved?: (setId: Id<"sets">) => void;
  onDelete?: () => void;
  onComplete?: (completed: boolean) => void;
}

export function SetRow({
  setIndex,
  setId,
  workoutId,
  exerciseId,
  userId,
  initialWeight,
  initialReps,
  previousSet,
  prCheck,
  autoFocus,
  onSaved,
  onDelete,
  onComplete,
}: SetRowProps) {
  const { t } = useAppPreferences();
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [saved, setSaved] = useState(!!setId);
  const [completed, setCompleted] = useState(false);

  const weightRef = useRef<HTMLInputElement>(null);
  const addSet = useMutation(api.sets.add);
  const updateSet = useMutation(api.sets.update);
  const removeSet = useMutation(api.sets.remove);

  useEffect(() => {
    if (autoFocus) weightRef.current?.focus();
  }, [autoFocus]);

  async function save() {
    if (weight <= 0 || reps <= 0) return;

    if (setId) {
      await updateSet({ setId, weight, reps });
    } else {
      const id = await addSet({
        workoutId,
        exerciseId,
        userId,
        weight,
        reps,
        setOrder: setIndex,
      });
      setSaved(true);
      onSaved?.(id);
    }
  }

  async function handleComplete() {
    if (completed) {
      setCompleted(false);
      onComplete?.(false);
      return;
    }

    if (weight <= 0 || reps <= 0) return;
    await save();
    setCompleted(true);
    onComplete?.(true);
  }

  async function handleDelete() {
    if (setId) await removeSet({ setId });
    onDelete?.();
  }

  function adjust(field: "weight" | "reps", delta: number) {
    if (field === "weight") {
      setWeight((v) => Math.max(0, +(v + delta).toFixed(1)));
      return;
    }
    setReps((v) => Math.max(0, v + delta));
  }

  const isPR = prCheck && (prCheck.isHeaviest || prCheck.isBest1RM);
  const prType = prCheck?.isBest1RM ? "1rm" : "weight";
  const hasProgress =
    previousSet &&
    weight > 0 &&
    reps > 0 &&
    (weight * reps > previousSet.weight * previousSet.reps ||
      estimated1RM(weight, reps) > estimated1RM(previousSet.weight, previousSet.reps));
  const previousLabel = previousSet
    ? `${formatWeight(previousSet.weight)} ${t("common.kg")} x ${previousSet.reps}`
    : "-";

  return (
    <div className="grid grid-cols-[2.25rem_minmax(5.5rem,1fr)_4.75rem_3.75rem_2.25rem_2rem] items-center gap-1.5 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/30">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
        {setIndex + 1}
      </span>

      <div className="flex min-w-0 items-center gap-1 text-xs">
        <span className="min-w-0 truncate text-muted-foreground">
          {previousLabel}
        </span>
        {hasProgress && (
          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        )}
      </div>

      <div className="grid min-w-0 grid-cols-[1fr] items-center">
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-7 w-7"
          onClick={() => adjust("weight", -2.5)}
          tabIndex={-1}
          aria-label={`${t("workout.weight")} reduzieren`}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          ref={weightRef}
          type="number"
          value={weight || ""}
          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          onBlur={save}
          className="h-8 min-w-0 rounded-lg border-0 bg-muted text-center text-sm font-medium"
          placeholder={t("common.kg")}
          aria-label={`${t("workout.weight")} ${setIndex + 1}`}
          step={2.5}
          min={0}
        />
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-7 w-7"
          onClick={() => adjust("weight", 2.5)}
          tabIndex={-1}
          aria-label={`${t("workout.weight")} erhoehen`}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid min-w-0 grid-cols-[1fr] items-center">
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-7 w-7"
          onClick={() => adjust("reps", -1)}
          tabIndex={-1}
          aria-label={`${t("common.reps")} reduzieren`}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          type="number"
          value={reps || ""}
          onChange={(e) => setReps(parseInt(e.target.value) || 0)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleComplete();
          }}
          className="h-8 min-w-0 rounded-lg border-0 bg-muted text-center text-sm font-medium"
          placeholder={t("common.reps")}
          aria-label={`${t("common.reps")} ${setIndex + 1}`}
          min={0}
        />
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-7 w-7"
          onClick={() => adjust("reps", 1)}
          tabIndex={-1}
          aria-label={`${t("common.reps")} erhoehen`}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <Button
        variant={completed ? "default" : "outline"}
        size="icon"
        className="h-8 w-8 rounded-lg"
        onClick={handleComplete}
        aria-label={`Set ${setIndex + 1} ${t("workout.completeSet")}`}
      >
        <Check className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
        tabIndex={-1}
        aria-label={`Set ${setIndex + 1} entfernen`}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
      {isPR && saved && (
        <span className="col-span-full pl-10 text-xs font-medium text-amber-500">
          {prType === "1rm" ? t("prs.best1rm") : t("prs.heaviest")}
        </span>
      )}
    </div>
  );
}
