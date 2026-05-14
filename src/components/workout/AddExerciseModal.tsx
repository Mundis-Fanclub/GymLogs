"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/constants";
import { getDefaultCategoriesForMuscleGroup } from "@/lib/default-exercises";
import { BODY_PARTS, toBodyPart, toSchemaMuscleGroup, type BodyPart } from "@/lib/muscle-groups";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";

interface AddExerciseModalProps {
  open: boolean;
  onClose: () => void;
  userId: Id<"users">;
  onSelect: (exercise: {
    id: Id<"exercises">;
    name: string;
    muscleGroup: string;
    category: string;
  }) => void;
}

export function AddExerciseModal({
  open,
  onClose,
  userId,
  onSelect,
}: AddExerciseModalProps) {
  const { t } = useAppPreferences();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");

  const exercises = useQuery(api.exercises.search, { query, limit: 30 });
  const createCustom = useMutation(api.exercises.createCustom);
  const availableCategories = useMemo<Category[]>(() => {
    if (!newMuscle) return [...CATEGORIES];
    const defaults = getDefaultCategoriesForMuscleGroup(newMuscle);
    return defaults.length > 0 ? defaults : [...CATEGORIES];
  }, [newMuscle]);

  useEffect(() => {
    if (!newMuscle) return;
    if (newCategory && !availableCategories.includes(newCategory as Category)) {
      setNewCategory("");
    }
    if (!newCategory && availableCategories.length === 1) {
      setNewCategory(availableCategories[0]);
    }
  }, [availableCategories, newCategory, newMuscle]);

  async function handleCreate() {
    if (!newName.trim() || !newMuscle || !newCategory) return;
    const id = await createCustom({
      name: newName.trim(),
      muscleGroup: toSchemaMuscleGroup(newMuscle as BodyPart) as never,
      category: newCategory as never,
      userId,
    });
    onSelect({ id, name: newName.trim(), muscleGroup: newMuscle, category: newCategory });
    onClose();
    setCreating(false);
    setNewName("");
    setNewMuscle("");
    setNewCategory("");
  }

  function handleSelect(ex: NonNullable<typeof exercises>[number]) {
    onSelect({ id: ex._id, name: ex.name, muscleGroup: ex.muscleGroup, category: ex.category });
    onClose();
    setQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85dvh] w-[calc(100vw-2rem)] max-w-md flex-col">
        <DialogHeader>
          <DialogTitle>{t("exercises.add")}</DialogTitle>
        </DialogHeader>

        {!creating ? (
          <>
            <Input
              placeholder={t("exercises.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="shrink-0"
            />

            <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
              {exercises?.map((ex) => (
                <button
                  key={ex._id}
                  onClick={() => handleSelect(ex)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                >
                  <span className="min-w-0 truncate">{ex.name}</span>
                  <span className="shrink-0 text-xs capitalize text-muted-foreground">
                    {t(`muscleGroups.${toBodyPart(ex.muscleGroup)}`)}
                  </span>
                </button>
              ))}
              {exercises?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("exercises.noExercises")}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setCreating(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              {t("exercises.createCustom")}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("exercises.name")}</Label>
              <Input
                placeholder={t("exercises.namePlaceholder")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("exercises.muscleGroup")}</Label>
              <Select
                value={newMuscle}
                onValueChange={(value) => setNewMuscle(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("exercises.selectMuscle")} />
                </SelectTrigger>
                <SelectContent>
                  {BODY_PARTS.map((mg) => (
                    <SelectItem key={mg} value={mg}>
                      {t(`muscleGroups.${mg}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("exercises.category")}</Label>
              <Select
                value={newCategory}
                onValueChange={(value) => setNewCategory(value ?? "")}
                disabled={!newMuscle}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("exercises.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setCreating(false)}
              >
                {t("exercises.cancel")}
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={!newName.trim() || !newMuscle || !newCategory}
              >
                {t("exercises.create")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
