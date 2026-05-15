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

export type WeeklySetVolumeZone = "none" | "low" | "moderate" | "high";

export const WEEKLY_SET_VOLUME_ZONES: Array<{
  zone: WeeklySetVolumeZone;
  label: string;
  minSets: number;
  maxSets: number | null;
  color: string;
}> = [
  {
    zone: "none",
    label: "0 Sätze",
    minSets: 0,
    maxSets: 0,
    color: "#cbd5e1",
  },
  {
    zone: "low",
    label: "1-5 Sätze",
    minSets: 1,
    maxSets: 5,
    color: "#22c55e",
  },
  {
    zone: "moderate",
    label: "6-10 Sätze",
    minSets: 6,
    maxSets: 10,
    color: "#eab308",
  },
  {
    zone: "high",
    label: "11+ Sätze",
    minSets: 11,
    maxSets: null,
    color: "#ef4444",
  },
];

export function getWeeklySetVolumeZone(setCount: number) {
  const normalizedSetCount = Math.max(0, Math.floor(setCount));

  return (
    WEEKLY_SET_VOLUME_ZONES.find((zone) => {
      if (normalizedSetCount < zone.minSets) return false;
      return zone.maxSets === null || normalizedSetCount <= zone.maxSets;
    }) ?? WEEKLY_SET_VOLUME_ZONES[0]
  );
}

export function getWeeklySetVolumeColor(setCount: number) {
  return getWeeklySetVolumeZone(setCount).color;
}

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
