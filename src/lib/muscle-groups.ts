import type { MuscleGroup } from "@/lib/constants";

export const BODY_PARTS = [
  "chest",
  "back",
  "biceps",
  "triceps",
  "core",
  "legs",
  "shoulders",
  "other",
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];

export const BODY_PART_COLORS: Record<BodyPart, string> = {
  chest: "#ef4444",
  back: "#3b82f6",
  biceps: "#f97316",
  triceps: "#ec4899",
  core: "#06b6d4",
  legs: "#22c55e",
  shoulders: "#a855f7",
  other: "#94a3b8",
};

export function toBodyPart(muscleGroup: string): BodyPart {
  if (muscleGroup === "quads") return "legs";
  if (muscleGroup === "hamstrings") return "legs";
  if (muscleGroup === "glutes") return "legs";
  if (muscleGroup === "calves") return "legs";
  if (muscleGroup === "full_body") return "other";
  if (muscleGroup === "cardio") return "other";
  if (BODY_PARTS.includes(muscleGroup as BodyPart)) {
    return muscleGroup as BodyPart;
  }
  return "other";
}

export function toSchemaMuscleGroup(bodyPart: BodyPart): MuscleGroup {
  return bodyPart as MuscleGroup;
}
