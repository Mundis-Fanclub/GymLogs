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
import { Plus, CheckCircle, Clock } from "lucide-react";
import { useConvexUser } from "@/hooks/useConvexUser";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

interface SelectedExercise {
  id: Id<"exercises">;
  name: string;
  muscleGroup: string;
  category: string;
}

interface ActiveWorkoutProps {
  workoutId: Id<"workouts">;
}

export function ActiveWorkout({ workoutId }: ActiveWorkoutProps) {
  const router = useRouter();
  const { userId } = useConvexUser();
  const { t } = useAppPreferences();
  const [exercises, setExercises] = useState<SelectedExercise[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [notes, setNotes] = useState("");
  const [elapsed, setElapsed] = useState("0:00");

  const workout = useQuery(api.workouts.get, { workoutId });
  const completeWorkout = useMutation(api.workouts.complete);
  const updateNotes = useMutation(api.workouts.updateNotes);

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

  async function handleFinish() {
    if (notes.trim()) {
      await updateNotes({ workoutId, notes });
    }
    await completeWorkout({ workoutId });
    router.push(`/workouts/${workoutId}`);
  }

  function handleAddExercise(exercise: SelectedExercise) {
    setExercises((prev) =>
      prev.some((e) => e.id === exercise.id) ? prev : [...prev, exercise]
    );
  }

  function handleRemoveExercise(id: Id<"exercises">) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  if (!userId) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="sticky top-3 z-10 flex items-center justify-between rounded-lg border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{elapsed}</span>
        </div>
        <Button onClick={handleFinish} className="h-9 gap-1.5">
          <CheckCircle className="w-4 h-4" />
          {t("workout.finish")}
        </Button>
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
    </div>
  );
}
