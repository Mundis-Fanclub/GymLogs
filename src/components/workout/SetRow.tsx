"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, TrendingUp, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  initialNotes?: string;
  initialRestSeconds?: number;
  defaultRestSeconds: number;
  previousSet?: PreviousSet;
  prCheck: PRCheck | null;
  autoFocus?: boolean;
  onSaved?: (setId: Id<"sets">, data: { weight: number; reps: number; notes?: string; restSeconds: number }) => void;
  onDelete?: () => void;
  onComplete?: (data: { completed: boolean; setId?: Id<"sets">; restSeconds: number }) => void;
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
  prCheck,
  autoFocus,
  onSaved,
  onDelete,
  onComplete,
}: SetRowProps) {
  const { t } = useAppPreferences();
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [restSeconds, setRestSeconds] = useState(initialRestSeconds ?? defaultRestSeconds);
  const [currentSetId, setCurrentSetId] = useState(setId);
  const [saved, setSaved] = useState(!!setId);
  const [completed, setCompleted] = useState(!!setId);

  const weightRef = useRef<HTMLInputElement>(null);
  const addSet = useMutation(api.sets.add);
  const updateSet = useMutation(api.sets.update);
  const removeSet = useMutation(api.sets.remove);

  useEffect(() => {
    if (autoFocus) weightRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!setId) return;
    setCurrentSetId(setId);
    setSaved(true);
  }, [setId]);

  useEffect(() => {
    if (saved || initialRestSeconds !== undefined) return;
    setRestSeconds(defaultRestSeconds);
  }, [defaultRestSeconds, initialRestSeconds, saved]);

  async function save(): Promise<Id<"sets"> | undefined> {
    if (weight <= 0 || reps <= 0) return currentSetId;

    if (currentSetId) {
      await updateSet({ setId: currentSetId, weight, reps, notes, restSeconds });
      onSaved?.(currentSetId, { weight, reps, notes, restSeconds });
      return currentSetId;
    } else {
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
      setSaved(true);
      onSaved?.(id, { weight, reps, notes, restSeconds });
      return id;
    }
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

  async function handleDelete() {
    if (currentSetId) await removeSet({ setId: currentSetId });
    onDelete?.();
  }

  function adjust(field: "weight" | "reps", delta: number) {
    if (field === "weight") {
      setWeight((v) => Math.max(0, +(v + delta).toFixed(1)));
      return;
    }
    setReps((v) => Math.max(0, v + delta));
  }

  const isPR = !previousSet || (prCheck && (prCheck.isHeaviest || prCheck.isBest1RM || prCheck.isMostReps));
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
    <div className="rounded-md px-1 py-1.5 transition-colors hover:bg-muted/30">
      <div className="grid grid-cols-[2.25rem_minmax(5.5rem,1fr)_4.75rem_3.75rem_2.25rem_2rem] items-center gap-1.5">
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
            aria-label={`${t("workout.weight")} erhöhen`}
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
            aria-label={`${t("common.reps")} erhöhen`}
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
      </div>

      <div className="mt-1 grid grid-cols-[2.25rem_1fr] gap-1.5">
        <span />
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
              <span>Pause</span>
              <Input
                type="number"
                value={Math.round(restSeconds / 60)}
                min={1}
                max={15}
                onChange={(event) =>
                  setRestSeconds(Math.max(30, Number(event.target.value || 1) * 60))
                }
                onBlur={save}
                className="h-6 w-12 border-0 bg-background/70 text-center text-xs"
                aria-label={`Pause nach Set ${setIndex + 1}`}
              />
              <span>min</span>
            </div>
            {isPR && saved && (
              <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-500">
                PR {previousSet ? (prType === "1rm" ? "1RM" : "") : "neu"}
              </span>
            )}
          </div>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={save}
            rows={1}
            className="min-h-8 resize-none border-0 bg-muted text-xs"
            placeholder="Notiz zu diesem Satz..."
            aria-label={`Notiz zu Set ${setIndex + 1}`}
          />
        </div>
      </div>
    </div>
  );
}
