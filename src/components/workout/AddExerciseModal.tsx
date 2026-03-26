"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { MUSCLE_GROUPS, CATEGORIES, MUSCLE_GROUP_LABELS, CATEGORY_LABELS } from "@/lib/constants";

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
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");

  const exercises = useQuery(api.exercises.search, { query, limit: 30 });
  const createCustom = useMutation(api.exercises.createCustom);

  async function handleCreate() {
    if (!newName.trim() || !newMuscle || !newCategory) return;
    const id = await createCustom({
      name: newName.trim(),
      muscleGroup: newMuscle as never,
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
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>

        {!creating ? (
          <>
            <Input
              placeholder="Search exercises..."
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
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-accent text-left text-sm transition-colors"
                >
                  <span>{ex.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {ex.muscleGroup.replace("_", " ")}
                  </span>
                </button>
              ))}
              {exercises?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No exercises found
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
              Create custom exercise
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="Exercise name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Muscle Group</Label>
              <Select value={newMuscle} onValueChange={setNewMuscle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select muscle group" />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((mg) => (
                    <SelectItem key={mg} value={mg}>
                      {MUSCLE_GROUP_LABELS[mg]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
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
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={!newName.trim() || !newMuscle || !newCategory}
              >
                Create
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
