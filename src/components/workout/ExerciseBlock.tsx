"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  Bell,
  Check,
  CircleEllipsis,
  FileText,
  Link2,
  Minus,
  Plus,
  Repeat2,
  Scale,
  Timer,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { usePRCheck } from "@/hooks/usePRCheck";
import { cn } from "@/lib/utils";
import { SetRow } from "./SetRow";

interface LocalSet {
  rowKey: string;
  id?: Id<"sets">;
  weight: number;
  reps: number;
  notes?: string;
  restSeconds?: number;
  completed?: boolean;
}

interface InitialSet {
  id: Id<"sets">;
  weight: number;
  reps: number;
  notes?: string;
  restSeconds?: number;
  setOrder: number;
}

interface ExerciseBlockProps {
  exerciseOrder: number;
  workoutId: Id<"workouts">;
  exerciseId: Id<"exercises">;
  exerciseName: string;
  muscleGroup: string;
  userId: Id<"users">;
  initialSets?: InitialSet[];
  activeRest: {
    exerciseId: Id<"exercises">;
    setIndex: number;
    durationSeconds: number;
  } | null;
  onRestStart: (rest: {
    exerciseId: Id<"exercises">;
    setIndex: number;
    durationSeconds: number;
  }) => void;
  onRestStop: (rest: { exerciseId: Id<"exercises">; setIndex: number }) => void;
  onRemove: () => void;
}

export function ExerciseBlock({
  exerciseOrder,
  workoutId,
  exerciseId,
  exerciseName,
  userId,
  initialSets,
  activeRest,
  onRestStart,
  onRestStop,
  onRemove,
}: ExerciseBlockProps) {
  const { t } = useAppPreferences();
  const [sets, setSets] = useState<LocalSet[]>(() => {
    if (!initialSets?.length) return [{ rowKey: "draft-0", weight: 0, reps: 0 }];
    return [...initialSets]
      .sort((a, b) => a.setOrder - b.setOrder)
      .map((set) => ({
        rowKey: `saved-${set.id}`,
        id: set.id,
        weight: set.weight,
        reps: set.reps,
        notes: set.notes,
        restSeconds: set.restSeconds,
        completed: true,
      }));
  });
  const [newSetAutoFocus, setNewSetAutoFocus] = useState(0);
  const [restSeconds, setRestSeconds] = useState(120);
  const [restDraftMinutes, setRestDraftMinutes] = useState(2);
  const [showRestMenu, setShowRestMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showExerciseNote, setShowExerciseNote] = useState(false);
  const [exerciseNote, setExerciseNote] = useState("");
  const [exerciseNoteDraft, setExerciseNoteDraft] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");

  const { check } = usePRCheck(userId, exerciseId);
  const saveRestPreference = useMutation(api.restPreferences.set);
  const updateSet = useMutation(api.sets.update);

  const lastPerformance = useQuery(api.sets.getLastPerformance, {
    userId,
    exerciseId,
    currentWorkoutId: workoutId,
  });

  const restPreference = useQuery(api.restPreferences.get, {
    userId,
    exerciseId,
  });

  useEffect(() => {
    if (!restPreference) return;
    setRestSeconds(restPreference.restSeconds);
    setRestDraftMinutes(Math.max(1, Math.round(restPreference.restSeconds / 60)));
  }, [restPreference]);

  function addSet() {
    const last = sets[sets.length - 1];
    setSets((prev) => [
      ...prev,
      {
        rowKey: `draft-${Date.now()}-${prev.length}`,
        weight: last?.weight ?? 0,
        reps: last?.reps ?? 0,
        restSeconds,
      },
    ]);
    setNewSetAutoFocus((value) => value + 1);
  }

  function addDropSet() {
    const lastCompleted = [...sets]
      .reverse()
      .find((set) => set.weight > 0 && set.reps > 0);
    const dropWeight = lastCompleted
      ? Math.max(0, Math.round(lastCompleted.weight * 0.75 * 10) / 10)
      : 0;

    setSets((prev) => [
      ...prev,
      {
        rowKey: `drop-${Date.now()}-${prev.length}`,
        weight: dropWeight,
        reps: 0,
        notes: "Dropsatz",
        restSeconds,
      },
    ]);
    setShowActionMenu(false);
    setNewSetAutoFocus((value) => value + 1);
  }

  function handleSaved(
    index: number,
    setId: Id<"sets">,
    data: { weight: number; reps: number; notes?: string; restSeconds: number }
  ) {
    setSets((prev) =>
      prev.map((set, i) => (i === index ? { ...set, id: setId, ...data } : set))
    );
  }

  function handleDelete(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  function handleComplete(
    index: number,
    data: { completed: boolean; setId?: Id<"sets">; restSeconds: number }
  ) {
    setSets((prev) =>
      prev.map((set, i) =>
        i === index
          ? {
              ...set,
              id: data.setId ?? set.id,
              completed: data.completed,
              restSeconds: data.restSeconds,
            }
          : set
      )
    );

    if (data.completed) {
      onRestStart({ exerciseId, setIndex: index, durationSeconds: data.restSeconds });
      return;
    }
    onRestStop({ exerciseId, setIndex: index });
  }

  async function updateRestForSet(
    index: number,
    nextRest: number,
    options: { persist?: boolean; min?: number } = {}
  ) {
    const persist = options.persist ?? true;
    const boundedRest = Math.max(options.min ?? 30, Math.min(900, nextRest));
    const targetSet = sets[index];
    const isRunningRest =
      activeRest?.exerciseId === exerciseId && activeRest.setIndex === index;

    if (persist) {
      setSets((prev) =>
        prev.map((set, i) =>
          i === index ? { ...set, restSeconds: boundedRest } : set
        )
      );
    }

    if (isRunningRest) {
      onRestStart({ exerciseId, setIndex: index, durationSeconds: boundedRest });
    }

    if (persist && targetSet?.id) {
      await updateSet({
        setId: targetSet.id,
        weight: targetSet.weight,
        reps: targetSet.reps,
        notes: targetSet.notes,
        restSeconds: boundedRest,
      });
    }
  }

  function applyRestForCurrentExercise() {
    const nextRest = Math.max(30, Math.min(900, restDraftMinutes * 60));
    setRestSeconds(nextRest);
    setSets((prev) =>
      prev.map((set) => (set.completed ? set : { ...set, restSeconds: nextRest }))
    );
    setShowRestMenu(false);
  }

  async function applyRestForFutureWorkouts() {
    const nextRest = Math.max(30, Math.min(900, restDraftMinutes * 60));
    setRestSeconds(nextRest);
    await saveRestPreference({ userId, exerciseId, restSeconds: nextRest });
    setShowRestMenu(false);
  }

  function toggleWeightUnit() {
    setWeightUnit((unit) => (unit === "kg" ? "lb" : "kg"));
    setShowActionMenu(false);
  }

  return (
    <section className="premium-panel overflow-visible rounded-xl p-3">
      <div className="relative flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-brand/25 bg-brand/10 text-base font-semibold text-brand">
          {exerciseOrder}
        </span>
        <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">
          {exerciseName}
        </h2>
        <Button
          variant="outline"
          size="icon-sm"
          className="size-8 rounded-lg border-border bg-input/20 text-brand"
          onClick={() => setShowRestMenu(true)}
          aria-label={`Pausen für ${exerciseName} einstellen`}
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          className="size-8 rounded-lg border-border bg-input/20 text-brand"
          onClick={() => setShowActionMenu((open) => !open)}
          aria-expanded={showActionMenu}
          aria-label={`${exerciseName} Aktionen`}
        >
          <CircleEllipsis className="h-4 w-4" />
        </Button>

        {showActionMenu && (
          <div className="absolute right-0 top-10 z-30 w-56 overflow-hidden rounded-xl border border-border bg-popover/98 p-1 text-sm text-popover-foreground shadow-2xl shadow-black/60 backdrop-blur-xl">
            <MenuAction
              icon={FileText}
              label="Notiz hinzufügen"
              onClick={() => {
                setExerciseNoteDraft(exerciseNote);
                setShowExerciseNote(true);
                setShowActionMenu(false);
              }}
            />
            <MenuAction
              icon={Scale}
              label={weightUnit === "kg" ? "In Pound anzeigen" : "In kg anzeigen"}
              onClick={toggleWeightUnit}
            />
            <MenuAction
              icon={Repeat2}
              label="Dropsatz hinzufügen"
              onClick={addDropSet}
            />
            <MenuAction
              icon={Timer}
              label="Pausen einstellen"
              onClick={() => {
                setShowRestMenu(true);
                setShowActionMenu(false);
              }}
            />
            <div className="my-1 h-px bg-border" />
            <MenuAction
              icon={Trash2}
              label="Übung löschen"
              destructive
              onClick={() => {
                setShowActionMenu(false);
                onRemove();
              }}
            />
          </div>
        )}
      </div>

      {showExerciseNote && (
        <>
        <Textarea
          value={exerciseNoteDraft}
          onChange={(event) => setExerciseNoteDraft(event.target.value)}
          placeholder="Notiz zu dieser Übung..."
          rows={2}
          className="mt-3 min-h-16 resize-none rounded-xl text-sm"
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setExerciseNoteDraft(exerciseNote);
              setShowExerciseNote(false);
            }}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setExerciseNote(exerciseNoteDraft.trim());
              setShowExerciseNote(false);
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Speichern
          </Button>
        </div>
        </>
      )}

      {!showExerciseNote && exerciseNote.trim() && (
        <button
          type="button"
          className="mt-3 w-full rounded-xl border border-border bg-input/12 px-3 py-2 text-left text-sm text-muted-foreground"
          onClick={() => {
            setExerciseNoteDraft(exerciseNote);
            setShowExerciseNote(true);
          }}
        >
          {exerciseNote}
        </button>
      )}

      <div className="mt-3 border-t border-border pt-3">
        <div className="grid grid-cols-[2.5rem_minmax(4.25rem,1fr)_4.5rem_4.5rem_2.25rem] items-center gap-1.5 px-1 pb-2 text-[10px] font-semibold uppercase text-muted-foreground">
          <span>{t("workout.set")}</span>
          <span>{t("workout.previous")}</span>
          <span className="text-center">{weightUnit}</span>
          <span className="text-center">Wiederh.</span>
          <Check className="mx-auto h-3.5 w-3.5" />
        </div>

        {sets.map((set, index) => {
          const setRest = set.restSeconds ?? restSeconds;
          const isActiveRest =
            activeRest?.exerciseId === exerciseId && activeRest.setIndex === index;

          return (
            <div key={set.rowKey}>
              <SetRow
                setIndex={index}
                setId={set.id}
                workoutId={workoutId}
                exerciseId={exerciseId}
                userId={userId}
                initialWeight={set.weight}
                initialReps={set.reps}
                initialNotes={set.notes}
                initialRestSeconds={setRest}
                defaultRestSeconds={restSeconds}
                previousSet={lastPerformance?.sets[index]}
                prCheck={set.weight > 0 && set.reps > 0 ? check(set.weight, set.reps) : null}
                weightUnit={weightUnit}
                autoFocus={index === sets.length - 1 && index === newSetAutoFocus}
                onSaved={(id, data) => handleSaved(index, id, data)}
                onDelete={() => handleDelete(index)}
                onComplete={(data) => handleComplete(index, data)}
              />
              {(index < sets.length - 1 || isActiveRest) && (
                <RestRow
                  seconds={isActiveRest ? activeRest.durationSeconds : setRest}
                  running={Boolean(isActiveRest)}
                  onChangeSeconds={(nextSeconds) =>
                    void updateRestForSet(index, nextSeconds, {
                      persist: !isActiveRest,
                      min: isActiveRest ? 0 : 30,
                    })
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        className="mt-3 h-10 w-full rounded-xl border-brand/45 text-sm text-brand hover:bg-brand/10"
        onClick={addSet}
      >
        <Plus className="mr-2 h-4 w-4" />
        Satz hinzufügen
      </Button>

      <Dialog open={showRestMenu} onOpenChange={setShowRestMenu}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Pausen für {exerciseName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Standardpause in Minuten
              </label>
              <Input
                type="number"
                min={1}
                max={15}
                value={restDraftMinutes}
                onChange={(event) =>
                  setRestDraftMinutes(Math.max(1, Number(event.target.value || 1)))
                }
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={applyRestForCurrentExercise}>
                Nur jetzt
              </Button>
              <Button onClick={applyRestForFutureWorkouts}>
                Für kommende Workouts
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MenuAction({
  icon: Icon,
  label,
  destructive,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left transition hover:bg-muted",
        destructive ? "text-destructive" : "text-foreground"
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

function RestRow({
  seconds,
  running,
  onChangeSeconds,
}: {
  seconds: number;
  running: boolean;
  onChangeSeconds: (seconds: number) => void;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [remaining, running]);

  const display = formatSeconds(remaining);
  const target = formatSeconds(seconds);

  function adjustTimer(deltaSeconds: number) {
    const baseSeconds = running ? remaining : seconds;
    const minSeconds = running ? 0 : 30;
    const nextSeconds = Math.max(
      minSeconds,
      Math.min(900, baseSeconds + deltaSeconds)
    );
    setRemaining(nextSeconds);
    onChangeSeconds(nextSeconds);
  }

  return (
    <div className="my-1.5 grid min-h-10 grid-cols-[minmax(4.5rem,1fr)_1.75rem_3.75rem_1.75rem_4.25rem] items-center gap-1.5 rounded-lg border border-border bg-input/12 px-2 text-sm">
      <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
        <Timer className="h-4 w-4" />
        Pause
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        className="size-7 rounded-md bg-input/25"
        onClick={() => adjustTimer(-15)}
        aria-label="Pause reduzieren"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="text-center font-semibold text-brand">{target}</span>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        className="size-7 rounded-md bg-input/25"
        onClick={() => adjustTimer(15)}
        aria-label="Pause erhöhen"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <span className="inline-flex justify-end gap-1.5 text-muted-foreground">
        {running && <Bell className="h-4 w-4 text-brand" />}
        {display}
      </span>
    </div>
  );
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
