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

  // QUADS - legs (compound bleibt "legs", Isolation -> quads)
  { name: "Squat", muscleGroup: "legs", category: "legs", bodygraphZones: ["quads", "glutes"] },
  { name: "Front Squat", muscleGroup: "legs", category: "legs", bodygraphZones: ["quads", "glutes"] },
  { name: "Hack Squat", muscleGroup: "legs", category: "legs", bodygraphZones: ["quads", "glutes"] },
  { name: "Leg Press", muscleGroup: "legs", category: "legs", bodygraphZones: ["quads", "hamstrings", "glutes"] },
  { name: "Leg Extension", muscleGroup: "quads", category: "legs" },
  { name: "Bulgarian Split Squat", muscleGroup: "legs", category: "legs", bodygraphZones: ["quads", "glutes", "hamstrings"] },
  { name: "Lunge", muscleGroup: "legs", category: "legs", bodygraphZones: ["quads", "glutes"] },

  // HAMSTRINGS - legs (compound bleibt "legs", Isolation -> hamstrings)
  { name: "Leg Curl", muscleGroup: "hamstrings", category: "legs" },
  { name: "Nordic Curl", muscleGroup: "hamstrings", category: "legs" },
  { name: "Stiff Leg Deadlift", muscleGroup: "legs", category: "legs", bodygraphZones: ["hamstrings", "glutes"] },
  { name: "Good Morning", muscleGroup: "legs", category: "legs", bodygraphZones: ["hamstrings", "glutes"] },

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
  { name: "Power Clean", muscleGroup: "other", category: "other" },
  { name: "Clean and Jerk", muscleGroup: "other", category: "other" },
  { name: "Snatch", muscleGroup: "other", category: "other" },
  { name: "Kettlebell Swing", muscleGroup: "other", category: "other" },
  { name: "Farmer's Walk", muscleGroup: "other", category: "other" },
] as const;

const LEADERBOARD_LIFTS: Record<string, "bench_press" | "squat" | "deadlift"> = {
  "Bench Press": "bench_press",
  Squat: "squat",
  Deadlift: "deadlift",
};

const STANDARD_BRACKETS = [
  "-52 kg",
  "-57 kg",
  "-63 kg",
  "-69 kg",
  "-76 kg",
  "-83 kg",
  "-93 kg",
  "-105 kg",
  "-120 kg",
  "120+ kg",
] as const;

export const seedExercises = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    let updated = 0;
    const existingExercises = await ctx.db.query("exercises").collect();

    for (const exercise of PREDEFINED_EXERCISES) {
      const leaderboardLiftType = LEADERBOARD_LIFTS[exercise.name];
      const existing = existingExercises.find(
        (item) => item.name.toLowerCase() === exercise.name.toLowerCase()
      );

      const patch = {
        muscleGroup: exercise.muscleGroup,
        category: exercise.category,
        isCustom: false,
        isLeaderboardLift: Boolean(leaderboardLiftType),
        ...(leaderboardLiftType ? { leaderboardLiftType } : {}),
        ...("bodygraphZones" in exercise && exercise.bodygraphZones
          ? { bodygraphZones: [...exercise.bodygraphZones] }
          : { bodygraphZones: undefined }),
      };

      if (existing) {
        await ctx.db.patch(existing._id, patch);
        updated += 1;
      } else {
        await ctx.db.insert("exercises", {
          name: exercise.name,
          ...patch,
        });
        inserted += 1;
      }
    }

    return `Seeded ${inserted} exercises, updated ${updated} exercises`;
  },
});

export const patchCustomBodygraphZones = internalMutation({
  args: {},
  handler: async (ctx) => {
    const customExercises = await ctx.db
      .query("exercises")
      .filter((q) => q.eq(q.field("isCustom"), true))
      .collect();

    type Zone =
      | "chest"
      | "back"
      | "shoulders"
      | "biceps"
      | "triceps"
      | "quads"
      | "hamstrings"
      | "glutes"
      | "calves"
      | "core"
      | "legs";
    const zonesByName: Record<string, Zone[]> = {
      Beinpresse: ["quads", "hamstrings", "glutes"],
      Beinbeuger: ["hamstrings"],
    };

    let patched = 0;
    for (const ex of customExercises) {
      const zones = zonesByName[ex.name];
      if (!zones) continue;
      if (ex.bodygraphZones && ex.bodygraphZones.length > 0) continue;
      await ctx.db.patch(ex._id, { bodygraphZones: zones });
      patched += 1;
    }

    return `Patched ${patched} custom exercises`;
  },
});

export const seedLogBrackets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const lifts = ["bench_press", "squat", "deadlift"] as const;
    const sexes = ["female", "male", "open"] as const;
    const equipment = "raw";
    let inserted = 0;

    for (const liftType of lifts) {
      for (const sex of sexes) {
        for (const bodyweightClass of STANDARD_BRACKETS) {
          const existing = await ctx.db
            .query("log_brackets")
            .withIndex("by_bracket", (q) =>
              q
                .eq("liftType", liftType)
                .eq("sex", sex)
                .eq("equipment", equipment)
                .eq("bodyweightClass", bodyweightClass)
            )
            .first();

          if (existing) continue;

          await ctx.db.insert("log_brackets", {
            liftType,
            sex,
            equipment,
            bodyweightClass,
            isActive: true,
            createdAt: Date.now(),
          });
          inserted += 1;
        }
      }
    }

    return `Seeded ${inserted} log brackets`;
  },
});
