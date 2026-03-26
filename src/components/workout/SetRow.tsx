"use client";

import { useState, useRef, useEffect } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PRBadge } from "@/components/pr/PRBadge";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { PRCheck } from "@/lib/pr-utils";

interface SetRowProps {
  setIndex: number;
  setId?: Id<"sets">;
  workoutId: Id<"workouts">;
  exerciseId: Id<"exercises">;
  userId: Id<"users">;
  initialWeight: number;
  initialReps: number;
  initialRir?: number;
  prCheck: PRCheck | null;
  autoFocus?: boolean;
  onSaved?: (setId: Id<"sets">) => void;
  onDelete?: () => void;
  onTabFromRir?: () => void;
}

export function SetRow({
  setIndex,
  setId,
  workoutId,
  exerciseId,
  userId,
  initialWeight,
  initialReps,
  initialRir,
  prCheck,
  autoFocus,
  onSaved,
  onDelete,
  onTabFromRir,
}: SetRowProps) {
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [rir, setRir] = useState<number | "">(initialRir ?? "");
  const [saved, setSaved] = useState(!!setId);

  const weightRef = useRef<HTMLInputElement>(null);
  const addSet = useMutation(api.sets.add);
  const updateSet = useMutation(api.sets.update);
  const removeSet = useMutation(api.sets.remove);

  useEffect(() => {
    if (autoFocus) weightRef.current?.focus();
  }, [autoFocus]);

  async function save() {
    if (weight <= 0 || reps <= 0) return;
    const rirVal = rir === "" ? undefined : Number(rir);

    if (setId) {
      await updateSet({ setId, weight, reps, rir: rirVal });
    } else {
      const id = await addSet({
        workoutId,
        exerciseId,
        userId,
        weight,
        reps,
        rir: rirVal,
        setOrder: setIndex,
      });
      setSaved(true);
      onSaved?.(id);
    }
  }

  async function handleDelete() {
    if (setId) await removeSet({ setId });
    onDelete?.();
  }

  function adjust(field: "weight" | "reps", delta: number) {
    if (field === "weight") setWeight((v) => Math.max(0, +(v + delta).toFixed(1)));
    else setReps((v) => Math.max(0, v + delta));
  }

  const isPR = prCheck && (prCheck.isHeaviest || prCheck.isBest1RM);
  const prType = prCheck?.isBest1RM ? "1rm" : "weight";

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-5 text-center text-xs text-muted-foreground shrink-0">
        {setIndex + 1}
      </span>

      {/* Weight */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => adjust("weight", -2.5)}
          tabIndex={-1}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          ref={weightRef}
          type="number"
          value={weight || ""}
          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          onBlur={save}
          className="h-8 w-20 text-center text-sm"
          placeholder="kg"
          step={2.5}
          min={0}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => adjust("weight", 2.5)}
          tabIndex={-1}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <span className="text-muted-foreground text-sm">×</span>

      {/* Reps */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => adjust("reps", -1)}
          tabIndex={-1}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <Input
          type="number"
          value={reps || ""}
          onChange={(e) => setReps(parseInt(e.target.value) || 0)}
          onBlur={save}
          className="h-8 w-16 text-center text-sm"
          placeholder="reps"
          min={0}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => adjust("reps", 1)}
          tabIndex={-1}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* RIR */}
      <Input
        type="number"
        value={rir}
        onChange={(e) =>
          setRir(e.target.value === "" ? "" : parseInt(e.target.value))
        }
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            save();
            onTabFromRir?.();
          }
        }}
        className="h-8 w-14 text-center text-sm"
        placeholder="RIR"
        min={0}
        max={10}
      />

      {isPR && saved && <PRBadge type={prType} />}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive ml-auto"
        onClick={handleDelete}
        tabIndex={-1}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
