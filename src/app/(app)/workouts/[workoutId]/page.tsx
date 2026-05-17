"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { formatVolume } from "@/lib/pr-utils";
import { WorkoutMuscleMap } from "@/components/workout/WorkoutMuscleMap";
import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { BODY_PARTS, toBodyPart, type BodyPart } from "@/lib/muscle-groups";
import { BookmarkPlus, Pencil, Trash2 } from "lucide-react";

export default function WorkoutDetailPage() {
  const { workoutId } = useParams();
  const router = useRouter();
  const { locale, t } = useAppPreferences();
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savedTemplate, setSavedTemplate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const workout = useQuery(api.workouts.get, {
    workoutId: workoutId as Id<"workouts">,
  });
  const saveAsTemplate = useMutation(api.workouts.saveAsTemplate);
  const removeWorkout = useMutation(api.workouts.remove);

  if (workout === undefined) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!workout) {
    return <p className="text-muted-foreground">{t("common.notFoundWorkout")}</p>;
  }

  const muscleGroupSets = workout.exercises.reduce(
    (counts, ex) => {
      if (!ex.exercise) return counts;
      const part = toBodyPart(ex.exercise.muscleGroup);
      counts[part] += ex.sets.length;
      return counts;
    },
    Object.fromEntries(BODY_PARTS.map((part) => [part, 0])) as Record<
      BodyPart,
      number
    >
  );

  async function handleSaveTemplate() {
    if (!workout || !templateName.trim()) return;
    await saveAsTemplate({
      workoutId: workout._id,
      name: templateName.trim(),
    });
    setSavedTemplate(true);
    setShowTemplateDialog(false);
  }

  async function handleDeleteWorkout() {
    if (!workout) return;
    await removeWorkout({ workoutId: workout._id });
    router.replace("/workouts");
  }

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Workout bearbeiten</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            Abbrechen
          </Button>
        </div>
        <ActiveWorkout
          workoutId={workout._id}
          onFinished={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">
            {format(workout.date, "EEEE, MMMM d", {
              locale: locale === "de" ? de : enUS,
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("common.totalVolume")}: {formatVolume(workout.totalVolume)}{" "}
            {t("common.kg")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
            Bearbeiten
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setTemplateName(
                format(workout.date, "EEEE, MMMM d", {
                  locale: locale === "de" ? de : enUS,
                })
              );
              setShowTemplateDialog(true);
            }}
          >
            <BookmarkPlus className="h-4 w-4" />
            {savedTemplate ? t("workouts.templateSaved") : t("workouts.saveTemplate")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      {workout.notes && (
        <p className="text-sm text-muted-foreground bg-muted/40 px-3 py-2 rounded">
          {workout.notes}
        </p>
      )}

      <WorkoutMuscleMap muscleGroups={[]} muscleGroupSets={muscleGroupSets} />

      <div className="space-y-3">
        {workout.exercises.map((ex) => {
          if (!ex.exercise) return null;
          const volume = ex.sets.reduce(
            (sum, s) => sum + s.weight * s.reps,
            0
          );
          return (
            <Card key={ex.exerciseId}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {ex.exercise.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {t(`muscleGroups.${toBodyPart(ex.exercise.muscleGroup)}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-1">
                  {ex.sets.map((set, i) => (
                    <div key={set._id} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground w-4">{i + 1}</span>
                      <span className="font-medium">
                        {set.weight} {t("common.kg")}
                      </span>
                      <span className="text-muted-foreground">x</span>
                      <span>
                        {set.reps} {t("common.reps")}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("common.volume")}: {formatVolume(volume)} {t("common.kg")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("workouts.saveTemplate")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder={t("workouts.templateName")}
              autoFocus
            />
            <Button
              className="w-full"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
            >
              {t("workouts.saveTemplate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>Workout löschen?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Dieses Workout und alle zugehörigen Sets werden dauerhaft gelöscht.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Abbrechen
              </Button>
              <Button
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteWorkout}
              >
                Löschen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
