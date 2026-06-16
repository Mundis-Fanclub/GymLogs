"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  MoreHorizontal,
  Plus,
  Trophy,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseBlock } from "./ExerciseBlock";
import { AddExerciseModal } from "./AddExerciseModal";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVolume } from "@/lib/pr-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SelectedExercise {
  id: Id<"exercises">;
  name: string;
  muscleGroup: string;
  category: string;
  sets?: {
    id: Id<"sets">;
    weight: number;
    reps: number;
    notes?: string;
    restSeconds?: number;
    setOrder: number;
  }[];
}

interface ActiveWorkoutProps {
  workoutId: Id<"workouts">;
  onFinished?: (workoutId: Id<"workouts">) => void;
  onCanceled?: (workoutId: Id<"workouts">) => void;
  isFinished?: boolean;
}

type WorkoutForSummary = {
  totalVolume: number;
  exercises: Array<{
    exerciseId: Id<"exercises">;
    exercise: { name: string } | null;
    sets: Array<{
      _id: Id<"sets">;
      weight: number;
      reps: number;
      notes?: string;
      previous?: { weight: number; reps: number };
      isPr?: boolean;
    }>;
  }>;
};

type ActiveRest = {
  exerciseId: Id<"exercises">;
  setIndex: number;
  durationSeconds: number;
};

export function ActiveWorkout({
  workoutId,
  onFinished,
  onCanceled,
  isFinished,
}: ActiveWorkoutProps) {
  const router = useRouter();
  const { userId } = useConvexUser();
  const { t } = useAppPreferences();
  const [exercises, setExercises] = useState<SelectedExercise[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [notes, setNotes] = useState("");
  const [elapsed, setElapsed] = useState("0:00");
  const [finishedWorkoutId, setFinishedWorkoutId] =
    useState<Id<"workouts"> | null>(isFinished ? workoutId : null);
  const [activeRest, setActiveRest] = useState<ActiveRest | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const workout = useQuery(api.workouts.get, { workoutId });
  const completeWorkout = useMutation(api.workouts.complete);
  const updateNotes = useMutation(api.workouts.updateNotes);
  const removeWorkout = useMutation(api.workouts.remove);
  const removeExerciseSets = useMutation(api.sets.removeForExercise);

  useEffect(() => {
    if (isFinished) setFinishedWorkoutId(workoutId);
  }, [isFinished, workoutId]);

  useEffect(() => {
    if (!workout) return;
    const start = workout.date;
    const interval = setInterval(() => {
      const secondsTotal = Math.floor((Date.now() - start) / 1000);
      const minutes = Math.floor(secondsTotal / 60);
      const seconds = secondsTotal % 60;
      setElapsed(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [workout]);

  useEffect(() => {
    if (!workout || exercises.length > 0) return;
    const restoredExercises = workout.exercises
      .filter((exercise) => exercise.exercise && exercise.sets.length > 0)
      .map((exercise) => ({
        id: exercise.exerciseId,
        name: exercise.exercise!.name,
        muscleGroup: exercise.exercise!.muscleGroup,
        category: exercise.exercise!.category,
        sets: exercise.sets.map((set) => ({
          id: set._id,
          weight: set.weight,
          reps: set.reps,
          notes: set.notes,
          restSeconds: set.restSeconds,
          setOrder: set.setOrder,
        })),
      }));

    if (restoredExercises.length > 0) setExercises(restoredExercises);
  }, [exercises.length, workout]);

  async function handleFinish() {
    const loggedSetCount =
      workout?.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0) ?? 0;
    if (loggedSetCount === 0) return;

    if (notes.trim()) await updateNotes({ workoutId, notes });
    await completeWorkout({ workoutId });
    setActiveRest(null);
    setFinishedWorkoutId(workoutId);
    onFinished?.(workoutId);
  }

  async function confirmCancel() {
    setIsCanceling(true);
    setActiveRest(null);
    onCanceled?.(workoutId);
    await removeWorkout({ workoutId });
    router.replace("/workouts");
  }

  function handleAddExercise(exercise: SelectedExercise) {
    setExercises((prev) =>
      prev.some((item) => item.id === exercise.id) ? prev : [...prev, exercise]
    );
  }

  async function handleRemoveExercise(id: Id<"exercises">) {
    await removeExerciseSets({ workoutId, exerciseId: id });
    setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
  }

  if (!userId) return null;

  if (finishedWorkoutId) {
    return (
      <WorkoutFinishedSummary
        workout={workout}
        onContinue={() => router.replace("/workouts")}
      />
    );
  }

  const loggedSetCount =
    workout?.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0) ?? 0;
  const canFinishWorkout = loggedSetCount > 0;
  const workoutDate = workout?.date
    ? new Date(workout.date).toLocaleDateString("de-DE")
    : "--.--.----";

  return (
    <div className="space-y-4 pb-5">
      <header className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-xl border-border bg-input/20 text-foreground"
            onClick={() => router.back()}
            aria-label="Zurueck"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleFinish}
            disabled={!canFinishWorkout || isCanceling}
            className="h-10 rounded-xl px-4 text-sm"
          >
            Beenden
          </Button>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="min-w-0 flex-1 truncate text-[2rem] font-semibold leading-none">
              Nachmittags-Workout
            </h1>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-xl border-border bg-input/20 text-foreground"
              aria-label="Workout Optionen"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-base text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {workoutDate}
            </span>
            <span className="h-5 w-px bg-border" />
            <span className="inline-flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {elapsed}
            </span>
            <span className="h-5 w-px bg-border" />
            <span className="inline-flex items-center gap-2 text-brand">
              <span className="size-3 rounded-full bg-brand" />
              Workout läuft
            </span>
          </div>
        </div>
      </header>

      {exercises.length === 0 && (
        <div className="premium-panel rounded-xl border-2 border-dashed border-border px-4 py-14 text-center">
          <p className="mb-4 text-muted-foreground">{t("workout.noExercises")}</p>
          <Button variant="outline" onClick={() => setShowAddExercise(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("workout.addFirst")}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <ExerciseBlock
            key={exercise.id}
            exerciseOrder={index + 1}
            workoutId={workoutId}
            exerciseId={exercise.id}
            exerciseName={exercise.name}
            muscleGroup={exercise.muscleGroup}
            userId={userId}
            initialSets={exercise.sets}
            activeRest={activeRest}
            onRestStart={setActiveRest}
            onRestStop={(rest) => {
              setActiveRest((current) =>
                current &&
                current.exerciseId === rest.exerciseId &&
                current.setIndex === rest.setIndex
                  ? null
                  : current
              );
            }}
            onRemove={() => handleRemoveExercise(exercise.id)}
          />
        ))}
      </div>

      {exercises.length > 0 && (
        <Button
          variant="outline"
          className="h-10 w-full gap-2 rounded-xl border-brand/45 text-sm text-brand hover:bg-brand/10"
          onClick={() => setShowAddExercise(true)}
        >
          <Plus className="h-4 w-4" />
          {t("workout.addExercise")}
        </Button>
      )}

      <Textarea
        aria-label={t("workout.notes")}
        placeholder="Workout-Notizen (optional)..."
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        className="min-h-[74px] resize-none rounded-xl text-sm"
      />

      <Button
        type="button"
        variant="destructive"
        onClick={() => setShowCancelDialog(true)}
        disabled={isCanceling}
        className="h-12 w-full rounded-xl border border-destructive/50 bg-destructive/15 text-sm text-destructive-foreground hover:bg-destructive/25"
      >
        Workout abbrechen
      </Button>

      <AddExerciseModal
        open={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        userId={userId}
        onSelect={handleAddExercise}
      />

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <DialogTitle>Workout abbrechen?</DialogTitle>
            </div>
            <DialogDescription>
              Alle Sätze, Notizen und Pausen aus diesem Workout werden gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCanceling}
            >
              Weiter trainieren
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmCancel}
              disabled={isCanceling}
            >
              Workout verwerfen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkoutFinishedSummary({
  workout,
  onContinue,
}: {
  workout: WorkoutForSummary | null | undefined;
  onContinue: () => void;
}) {
  if (workout === undefined) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Workout wird zusammengefasst...
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Workout nicht gefunden.</p>
        <Button onClick={onContinue}>Zur Workout-Übersicht</Button>
      </div>
    );
  }

  const exerciseCount = workout.exercises.length;
  const setCount = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0
  );

  return (
    <div className="space-y-4">
      <Card className="border-success/30 bg-success/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-success" />
            <CardTitle>Workout abgeschlossen</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-2xl font-semibold">{exerciseCount}</p>
            <p className="text-xs text-muted-foreground">Übungen</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{setCount}</p>
            <p className="text-xs text-muted-foreground">Sets</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">
              {formatVolume(workout.totalVolume)} kg
            </p>
            <p className="text-xs text-muted-foreground">Volumen</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {workout.exercises.map((exercise) => (
          <Card key={exercise.exerciseId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {exercise.exercise?.name ?? "Übung"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exercise.sets.map((set, index) => (
                <div
                  key={set._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">Set {index + 1}</span>
                    <span className="ml-2 text-muted-foreground">
                      {set.weight} kg x {set.reps}
                    </span>
                    {set.previous && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        vorher {set.previous.weight} kg x {set.previous.reps}
                      </span>
                    )}
                    {set.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {set.notes}
                      </p>
                    )}
                  </div>
                  {set.isPr && <Badge>PR</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full" onClick={onContinue}>
        Zur Workout-Übersicht
      </Button>
    </div>
  );
}
