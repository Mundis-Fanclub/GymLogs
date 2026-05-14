"use client";

import { useEffect, useState } from "react";
import { Bell, Menu, Minus, Plus, Timer, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { usePRCheck } from "@/hooks/usePRCheck";
import { SetRow } from "./SetRow";

interface LocalSet {
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
    if (!initialSets?.length) return [{ weight: 0, reps: 0 }];
    return [...initialSets]
      .sort((a, b) => a.setOrder - b.setOrder)
      .map((set) => ({
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

  const { check } = usePRCheck(userId, exerciseId);
  const saveRestPreference = useMutation(api.restPreferences.set);

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
      { weight: last?.weight ?? 0, reps: last?.reps ?? 0 },
    ]);
    setNewSetAutoFocus((n) => n + 1);
  }

  function handleSaved(
    index: number,
    setId: Id<"sets">,
    data: { weight: number; reps: number; notes?: string; restSeconds: number }
  ) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, id: setId, ...data } : s))
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
      onRestStart({
        exerciseId,
        setIndex: index,
        durationSeconds: data.restSeconds,
      });
      return;
    }
    onRestStop({ exerciseId, setIndex: index });
  }

  function formatRest(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${rest.toString().padStart(2, "0")}`;
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

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-sky-500">
            {exerciseName}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setShowRestMenu(true)}
            aria-label={`Pausen fuer ${exerciseName} einstellen`}
          >
            <Menu className="w-3.5 h-3.5" />
          </Button>
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border/70 bg-muted/30 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 text-sm">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatRest(restSeconds)}</span>
          <span className="text-xs text-muted-foreground">Standardpause</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setRestSeconds((seconds) => Math.max(30, seconds - 15))}
            aria-label={t("workout.decreaseRest")}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setRestSeconds((seconds) => Math.min(900, seconds + 15))}
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
          <div key={set.id ?? index}>
            <SetRow
              setIndex={index}
              setId={set.id}
              workoutId={workoutId}
              exerciseId={exerciseId}
              userId={userId}
              initialWeight={set.weight}
              initialReps={set.reps}
              initialNotes={set.notes}
              initialRestSeconds={set.restSeconds}
              defaultRestSeconds={restSeconds}
              previousSet={lastPerformance?.sets[index]}
              prCheck={
                set.weight > 0 && set.reps > 0 ? check(set.weight, set.reps) : null
              }
              autoFocus={index === sets.length - 1 && index === newSetAutoFocus}
              onSaved={(id, data) => handleSaved(index, id, data)}
              onDelete={() => handleDelete(index)}
              onComplete={(data) => handleComplete(index, data)}
            />
            {activeRest &&
              activeRest.exerciseId === exerciseId &&
              activeRest.setIndex === index && (
              <RestBreak
                key={`${exerciseId}-${activeRest.setIndex}-${activeRest.durationSeconds}`}
                durationSeconds={activeRest.durationSeconds}
                label={`Pause nach Set ${activeRest.setIndex + 1}`}
              />
            )}
          </div>
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

      <Dialog open={showRestMenu} onOpenChange={setShowRestMenu}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pausen fuer {exerciseName}</DialogTitle>
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
                Fuer kommende Workouts
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RestBreak({
  durationSeconds,
  label,
}: {
  durationSeconds: number;
  label: string;
}) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [done, setDone] = useState(durationSeconds <= 0);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setRemaining(durationSeconds);
    setDone(durationSeconds <= 0);
  }, [durationSeconds]);

  useEffect(() => {
    if (done || remaining <= 0) return;
    const interval = window.setInterval(() => {
      setRemaining((seconds) => {
        const next = Math.max(0, seconds - 1);
        if (next === 0) {
          setDone(true);
          setShowToast(true);
          notifyRestDone();
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [done, remaining]);

  useEffect(() => {
    if (!showToast) return;
    const timeout = window.setTimeout(() => setShowToast(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [showToast]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <>
      <div className="mx-1 my-2 flex items-center justify-between rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-sky-400" />
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">
            {done ? "Pause ist um. Zurueck an die Arbeit." : display}
          </span>
        </div>
        {!done && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => setRemaining((value) => Math.max(0, value - 15))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => setRemaining((value) => Math.min(900, value + 15))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      {showToast && (
        <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-emerald-500/30 bg-background px-4 py-3 text-sm shadow-lg">
          <p className="font-semibold">Pause ist um</p>
          <p className="text-muted-foreground">Zurueck an die Arbeit.</p>
        </div>
      )}
    </>
  );
}

function notifyRestDone() {
  const title = "Pause ist um";
  const body = "Zurueck an die Arbeit.";

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
    return;
  }

  if ("Notification" in window && Notification.permission === "default") {
    void Notification.requestPermission().then((permission) => {
      if (permission === "granted") new Notification(title, { body });
    });
  }
}
