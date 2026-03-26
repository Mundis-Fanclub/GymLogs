import { internalMutation } from "./_generated/server";

const PREDEFINED_EXERCISES = [
  // CHEST - push
  { name: "Bench Press", muscleGroup: "chest", category: "push" },
  { name: "Incline Bench Press", muscleGroup: "chest", category: "push" },
  { name: "Decline Bench Press", muscleGroup: "chest", category: "push" },
  { name: "Dumbbell Fly", muscleGroup: "chest", category: "push" },
  { name: "Cable Fly", muscleGroup: "chest", category: "push" },
  { name: "Push-up", muscleGroup: "chest", category: "push" },
  { name: "Dips (Chest)", muscleGroup: "chest", category: "push" },
  { name: "Pec Deck", muscleGroup: "chest", category: "push" },

  // BACK - pull
  { name: "Deadlift", muscleGroup: "back", category: "pull" },
  { name: "Pull-up", muscleGroup: "back", category: "pull" },
  { name: "Chin-up", muscleGroup: "back", category: "pull" },
  { name: "Barbell Row", muscleGroup: "back", category: "pull" },
  { name: "Dumbbell Row", muscleGroup: "back", category: "pull" },
  { name: "Lat Pulldown", muscleGroup: "back", category: "pull" },
  { name: "Seated Cable Row", muscleGroup: "back", category: "pull" },
  { name: "T-Bar Row", muscleGroup: "back", category: "pull" },
  { name: "Face Pull", muscleGroup: "back", category: "pull" },
  { name: "Romanian Deadlift", muscleGroup: "back", category: "pull" },

  // SHOULDERS - push
  { name: "Overhead Press", muscleGroup: "shoulders", category: "push" },
  { name: "Dumbbell Shoulder Press", muscleGroup: "shoulders", category: "push" },
  { name: "Lateral Raise", muscleGroup: "shoulders", category: "push" },
  { name: "Front Raise", muscleGroup: "shoulders", category: "push" },
  { name: "Rear Delt Fly", muscleGroup: "shoulders", category: "pull" },
  { name: "Arnold Press", muscleGroup: "shoulders", category: "push" },
  { name: "Upright Row", muscleGroup: "shoulders", category: "pull" },

  // BICEPS - pull
  { name: "Barbell Curl", muscleGroup: "biceps", category: "pull" },
  { name: "Dumbbell Curl", muscleGroup: "biceps", category: "pull" },
  { name: "Hammer Curl", muscleGroup: "biceps", category: "pull" },
  { name: "Incline Dumbbell Curl", muscleGroup: "biceps", category: "pull" },
  { name: "Cable Curl", muscleGroup: "biceps", category: "pull" },
  { name: "Preacher Curl", muscleGroup: "biceps", category: "pull" },
  { name: "Concentration Curl", muscleGroup: "biceps", category: "pull" },

  // TRICEPS - push
  { name: "Tricep Pushdown", muscleGroup: "triceps", category: "push" },
  { name: "Skull Crusher", muscleGroup: "triceps", category: "push" },
  { name: "Overhead Tricep Extension", muscleGroup: "triceps", category: "push" },
  { name: "Close-Grip Bench Press", muscleGroup: "triceps", category: "push" },
  { name: "Dips (Triceps)", muscleGroup: "triceps", category: "push" },
  { name: "Cable Overhead Tricep Extension", muscleGroup: "triceps", category: "push" },

  // QUADS - legs
  { name: "Squat", muscleGroup: "quads", category: "legs" },
  { name: "Front Squat", muscleGroup: "quads", category: "legs" },
  { name: "Hack Squat", muscleGroup: "quads", category: "legs" },
  { name: "Leg Press", muscleGroup: "quads", category: "legs" },
  { name: "Leg Extension", muscleGroup: "quads", category: "legs" },
  { name: "Bulgarian Split Squat", muscleGroup: "quads", category: "legs" },
  { name: "Lunge", muscleGroup: "quads", category: "legs" },

  // HAMSTRINGS - legs
  { name: "Leg Curl", muscleGroup: "hamstrings", category: "legs" },
  { name: "Nordic Curl", muscleGroup: "hamstrings", category: "legs" },
  { name: "Stiff Leg Deadlift", muscleGroup: "hamstrings", category: "legs" },
  { name: "Good Morning", muscleGroup: "hamstrings", category: "legs" },

  // GLUTES - legs
  { name: "Hip Thrust", muscleGroup: "glutes", category: "legs" },
  { name: "Glute Bridge", muscleGroup: "glutes", category: "legs" },
  { name: "Cable Kickback", muscleGroup: "glutes", category: "legs" },

  // CALVES - legs
  { name: "Standing Calf Raise", muscleGroup: "calves", category: "legs" },
  { name: "Seated Calf Raise", muscleGroup: "calves", category: "legs" },
  { name: "Donkey Calf Raise", muscleGroup: "calves", category: "legs" },

  // CORE - other
  { name: "Plank", muscleGroup: "core", category: "other" },
  { name: "Ab Wheel Rollout", muscleGroup: "core", category: "other" },
  { name: "Cable Crunch", muscleGroup: "core", category: "other" },
  { name: "Hanging Leg Raise", muscleGroup: "core", category: "other" },
  { name: "Russian Twist", muscleGroup: "core", category: "other" },

  // FULL BODY - other
  { name: "Power Clean", muscleGroup: "full_body", category: "other" },
  { name: "Clean and Jerk", muscleGroup: "full_body", category: "other" },
  { name: "Snatch", muscleGroup: "full_body", category: "other" },
  { name: "Kettlebell Swing", muscleGroup: "full_body", category: "other" },
  { name: "Farmer's Walk", muscleGroup: "full_body", category: "other" },
] as const;

export const seedExercises = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("exercises").first();
    if (existing) {
      return "Already seeded";
    }

    for (const exercise of PREDEFINED_EXERCISES) {
      await ctx.db.insert("exercises", {
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        category: exercise.category,
        isCustom: false,
      });
    }

    return `Seeded ${PREDEFINED_EXERCISES.length} exercises`;
  },
});
