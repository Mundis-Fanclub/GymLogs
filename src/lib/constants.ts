export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "legs",
  "other",
  "full_body",
  "cardio",
] as const;

export const CATEGORIES = ["push", "pull", "legs", "other"] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type Category = (typeof CATEGORIES)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  core: "Core",
  legs: "Legs",
  other: "Other",
  full_body: "Full Body",
  cardio: "Cardio",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  other: "Other",
};

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest: "#ef4444",
  back: "#3b82f6",
  shoulders: "#a855f7",
  biceps: "#f97316",
  triceps: "#ec4899",
  quads: "#22c55e",
  hamstrings: "#14b8a6",
  glutes: "#f59e0b",
  calves: "#84cc16",
  core: "#06b6d4",
  legs: "#22c55e",
  other: "#94a3b8",
  full_body: "#8b5cf6",
  cardio: "#64748b",
};
