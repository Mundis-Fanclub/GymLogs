import { CATEGORIES, type Category, type MuscleGroup } from "@/lib/constants";
import { toBodyPart } from "@/lib/muscle-groups";

export type DefaultExercise = {
  _id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: Category;
  isCustom: false;
  isFallback: true;
  isLeaderboardLift?: boolean;
  leaderboardLiftType?: "bench_press" | "squat" | "deadlift";
};

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  { _id: "fallback-bench-press", name: "Bench Press", muscleGroup: "chest", category: "push", isCustom: false, isFallback: true, isLeaderboardLift: true, leaderboardLiftType: "bench_press" },
  { _id: "fallback-incline-bench-press", name: "Incline Bench Press", muscleGroup: "chest", category: "push", isCustom: false, isFallback: true },
  { _id: "fallback-cable-fly", name: "Cable Fly", muscleGroup: "chest", category: "push", isCustom: false, isFallback: true },
  { _id: "fallback-deadlift", name: "Deadlift", muscleGroup: "back", category: "pull", isCustom: false, isFallback: true, isLeaderboardLift: true, leaderboardLiftType: "deadlift" },
  { _id: "fallback-pull-up", name: "Pull-up", muscleGroup: "back", category: "pull", isCustom: false, isFallback: true },
  { _id: "fallback-barbell-row", name: "Barbell Row", muscleGroup: "back", category: "pull", isCustom: false, isFallback: true },
  { _id: "fallback-lat-pulldown", name: "Lat Pulldown", muscleGroup: "back", category: "pull", isCustom: false, isFallback: true },
  { _id: "fallback-overhead-press", name: "Overhead Press", muscleGroup: "shoulders", category: "push", isCustom: false, isFallback: true },
  { _id: "fallback-lateral-raise", name: "Lateral Raise", muscleGroup: "shoulders", category: "push", isCustom: false, isFallback: true },
  { _id: "fallback-barbell-curl", name: "Barbell Curl", muscleGroup: "biceps", category: "pull", isCustom: false, isFallback: true },
  { _id: "fallback-tricep-pushdown", name: "Tricep Pushdown", muscleGroup: "triceps", category: "push", isCustom: false, isFallback: true },
  { _id: "fallback-squat", name: "Squat", muscleGroup: "legs", category: "legs", isCustom: false, isFallback: true, isLeaderboardLift: true, leaderboardLiftType: "squat" },
  { _id: "fallback-front-squat", name: "Front Squat", muscleGroup: "legs", category: "legs", isCustom: false, isFallback: true },
  { _id: "fallback-leg-press", name: "Leg Press", muscleGroup: "legs", category: "legs", isCustom: false, isFallback: true },
  { _id: "fallback-leg-curl", name: "Leg Curl", muscleGroup: "legs", category: "legs", isCustom: false, isFallback: true },
  { _id: "fallback-hip-thrust", name: "Hip Thrust", muscleGroup: "legs", category: "legs", isCustom: false, isFallback: true },
  { _id: "fallback-standing-calf-raise", name: "Standing Calf Raise", muscleGroup: "legs", category: "legs", isCustom: false, isFallback: true },
  { _id: "fallback-plank", name: "Plank", muscleGroup: "core", category: "other", isCustom: false, isFallback: true },
];

export function filterDefaultExercises(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return DEFAULT_EXERCISES;
  return DEFAULT_EXERCISES.filter((exercise) =>
    exercise.name.toLowerCase().includes(normalized)
  );
}

export function getDefaultCategoriesForMuscleGroup(
  muscleGroup: string
): Category[] {
  const categories = new Set(
    DEFAULT_EXERCISES.filter(
      (exercise) => toBodyPart(exercise.muscleGroup) === muscleGroup
    )
      .map((exercise) => exercise.category)
  );

  return CATEGORIES.filter((category) => categories.has(category));
}
