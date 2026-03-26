"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { checkIsPR, type PRCheck } from "@/lib/pr-utils";

export function usePRCheck(
  userId: Id<"users"> | undefined,
  exerciseId: Id<"exercises"> | undefined
) {
  const prs = useQuery(
    api.prs.getForExercise,
    userId && exerciseId ? { userId, exerciseId } : "skip"
  );

  function check(weight: number, reps: number): PRCheck {
    return checkIsPR(prs ?? null, weight, reps);
  }

  return { check, prs };
}
