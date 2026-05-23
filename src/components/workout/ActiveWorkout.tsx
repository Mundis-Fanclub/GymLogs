"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseBlock } from "./ExerciseBlock";
import { AddExerciseModal } from "./AddExerciseModal";
import { Plus, CheckCircle, Clock, Trophy, XCircle, AlertTriangle } from "lucide-react";
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

  // Timer
  useEffect(() => {
    if (!workout) return;
    const start = workout.date;
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(`${m}:${s.toString().padStart(2, "0")}`);
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

    if (restoredExercises.length > 0) {
      setExercises(restoredExercises);
    }
  }, [exercises.length, workout]);

  async function handleFinish() {
    const loggedSetCount =
      workout?.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0
      ) ?? 0;
    if (loggedSetCount === 0) return;

    if (notes.trim()) {
      await updateNotes({ workoutId, notes });
    }
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
      prev.some((e) => e.id === exercise.id) ? prev : [...prev, exercise]
    );
  }

  async function handleRemoveExercise(id: Id<"exercises">) {
    await removeExerciseSets({ workoutId, exerciseId: id });
    setExercises((prev) => prev.filter((e) => e.id !== id));
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
    workout?.exercises.reduce(
      (sum, exercise) => sum + exercise.sets.length,
      0
    ) ?? 0;
  const canFinishWorkout = loggedSetCount > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="sticky top-3 z-10 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{elapsed}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => setShowCancelDialog(true)}
            disabled={isCanceling}
            className="h-9 gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            Abbrechen
          </Button>
          <Button
            onClick={handleFinish}
            disabled={!canFinishWorkout || isCanceling}
            className="h-9 gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            {t("workout.finish")}
          </Button>
        </div>
      </div>

      {exercises.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-border px-4 py-14 text-center">
          <p className="text-muted-foreground mb-4">{t("workout.noExercises")}</p>
          <Button variant="outline" onClick={() => setShowAddExercise(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("workout.addFirst")}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {exercises.map((exercise) => (
          <ExerciseBlock
            key={exercise.id}
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
          className="w-full gap-2"
          onClick={() => setShowAddExercise(true)}
        >
          <Plus className="w-4 h-4" />
          {t("workout.addExercise")}
        </Button>
      )}

      <div className="space-y-1.5">
        <Textarea
          aria-label={t("workout.notes")}
          placeholder={t("workout.notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none text-sm"
        />
      </div>

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
      <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Workout wird zusammengefasst...
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
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
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="border-success/30 bg-success/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-success" />
            <CardTitle>Workout abgeschlossen</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
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
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
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
