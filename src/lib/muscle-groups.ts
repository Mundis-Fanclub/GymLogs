import type { MuscleGroup } from "@/lib/constants";

export const BODY_PARTS = [
  "chest",
  "back",
  "biceps",
  "triceps",
  "core",
  "legs",
  "quads",
  "hamstrings",
  "calves",
  "glutes",
  "shoulders",
  "other",
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];

export const SUB_LEG_PARTS = ["quads", "hamstrings", "calves"] as const;
export type SubLegPart = (typeof SUB_LEG_PARTS)[number];

export const DISPLAY_BODY_PARTS = BODY_PARTS.filter(
  (part): part is Exclude<BodyPart, SubLegPart> =>
    !(SUB_LEG_PARTS as readonly string[]).includes(part)
);
export type DisplayBodyPart = (typeof DISPLAY_BODY_PARTS)[number];

export function toDisplayBodyPart(part: BodyPart): DisplayBodyPart {
  return (SUB_LEG_PARTS as readonly string[]).includes(part)
    ? "legs"
    : (part as DisplayBodyPart);
}

export function legsAggregatedSetCount(
  setCounts: Partial<Record<BodyPart, number>>
): number {
  return (
    (setCounts.legs ?? 0) +
    (setCounts.quads ?? 0) +
    (setCounts.hamstrings ?? 0) +
    (setCounts.calves ?? 0)
  );
}

export function exerciseBodygraphParts(exercise: {
  muscleGroup: string;
  bodygraphZones?: string[];
}): BodyPart[] {
  if (exercise.bodygraphZones && exercise.bodygraphZones.length > 0) {
    return exercise.bodygraphZones.map(toBodyPart);
  }
  return [toBodyPart(exercise.muscleGroup)];
}

export const BODY_PART_COLORS: Record<BodyPart, string> = {
  chest: "#ef4444",
  back: "#3b82f6",
  biceps: "#f97316",
  triceps: "#ec4899",
  core: "#06b6d4",
  legs: "#22c55e",
  quads: "#10b981",
  hamstrings: "#84cc16",
  calves: "#65a30d",
  glutes: "#f59e0b",
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
    color: "#4ade80",
  },
  {
    zone: "moderate",
    label: "6-10 Sätze",
    minSets: 6,
    maxSets: 10,
    color: "#fde047",
  },
  {
    zone: "high",
    label: "11+ Sätze",
    minSets: 11,
    maxSets: null,
    color: "#f87171",
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
