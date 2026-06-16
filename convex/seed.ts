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

type GymLogsTemplateSeed = {
  name: string;
  description: string;
  executionCount: number;
  exercises: Array<{
    name: string;
    sets: Array<{ weight: number; reps: number }>;
  }>;
};

const GYMLOGS_WORKOUT_TEMPLATES: GymLogsTemplateSeed[] = [
  {
    name: "GymLogs Klassiker: Ganzkoerper",
    description: "Ausgewogener Ganzkoerper-Plan fuer Kraft, Muskelaufbau und saubere Progression.",
    executionCount: 1840,
    exercises: [
      { name: "Squat", sets: [{ weight: 80, reps: 8 }, { weight: 85, reps: 6 }, { weight: 85, reps: 6 }] },
      { name: "Bench Press", sets: [{ weight: 65, reps: 8 }, { weight: 70, reps: 6 }, { weight: 70, reps: 6 }] },
      { name: "Barbell Row", sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
      { name: "Romanian Deadlift", sets: [{ weight: 75, reps: 8 }, { weight: 75, reps: 8 }, { weight: 75, reps: 8 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 22.5, reps: 10 }, { weight: 22.5, reps: 10 }] },
      { name: "Lat Pulldown", sets: [{ weight: 55, reps: 12 }, { weight: 55, reps: 12 }] },
      { name: "Cable Crunch", sets: [{ weight: 35, reps: 15 }, { weight: 35, reps: 15 }] },
    ],
  },
  {
    name: "GymLogs: Oberkoerper Aufbau",
    description: "Premium Oberkoerper-Session mit Fokus auf Brust, Ruecken, Schultern und Arme.",
    executionCount: 1320,
    exercises: [
      { name: "Incline Bench Press", sets: [{ weight: 55, reps: 10 }, { weight: 60, reps: 8 }, { weight: 60, reps: 8 }] },
      { name: "Pull-up", sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 8 }, { weight: 0, reps: 6 }] },
      { name: "Dumbbell Shoulder Press", sets: [{ weight: 22.5, reps: 10 }, { weight: 22.5, reps: 10 }, { weight: 20, reps: 12 }] },
      { name: "Seated Cable Row", sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 60, reps: 10 }] },
      { name: "Lateral Raise", sets: [{ weight: 10, reps: 15 }, { weight: 10, reps: 15 }, { weight: 10, reps: 15 }] },
      { name: "Tricep Pushdown", sets: [{ weight: 35, reps: 12 }, { weight: 35, reps: 12 }] },
      { name: "Dumbbell Curl", sets: [{ weight: 15, reps: 12 }, { weight: 15, reps: 12 }] },
    ],
  },
  {
    name: "GymLogs: Push Day Alpha",
    description: "Intensiver Push-Fokus fuer Brust, Schulterdruck und starke Trizeps-Arbeit.",
    executionCount: 980,
    exercises: [
      { name: "Bench Press", sets: [{ weight: 75, reps: 6 }, { weight: 80, reps: 5 }, { weight: 80, reps: 5 }] },
      { name: "Incline Bench Press", sets: [{ weight: 55, reps: 8 }, { weight: 55, reps: 8 }, { weight: 50, reps: 10 }] },
      { name: "Arnold Press", sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }] },
      { name: "Cable Fly", sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 12 }, { weight: 25, reps: 12 }] },
      { name: "Lateral Raise", sets: [{ weight: 10, reps: 15 }, { weight: 10, reps: 15 }, { weight: 10, reps: 15 }] },
      { name: "Overhead Tricep Extension", sets: [{ weight: 27.5, reps: 12 }, { weight: 27.5, reps: 12 }] },
    ],
  },
  {
    name: "GymLogs: Beine Power",
    description: "Kompakter Lower-Body-Plan fuer Quads, Hamstrings und Glutes.",
    executionCount: 860,
    exercises: [
      { name: "Squat", sets: [{ weight: 85, reps: 6 }, { weight: 90, reps: 5 }, { weight: 90, reps: 5 }] },
      { name: "Leg Press", sets: [{ weight: 180, reps: 10 }, { weight: 180, reps: 10 }, { weight: 180, reps: 10 }] },
      { name: "Romanian Deadlift", sets: [{ weight: 85, reps: 8 }, { weight: 85, reps: 8 }, { weight: 85, reps: 8 }] },
      { name: "Bulgarian Split Squat", sets: [{ weight: 22.5, reps: 10 }, { weight: 22.5, reps: 10 }] },
      { name: "Leg Curl", sets: [{ weight: 45, reps: 12 }, { weight: 45, reps: 12 }] },
      { name: "Standing Calf Raise", sets: [{ weight: 70, reps: 15 }, { weight: 70, reps: 15 }, { weight: 70, reps: 15 }] },
    ],
  },
];

export const seedGymLogsWorkoutTemplates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingGymLogsUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "gymlogs"))
      .unique();

    const now = Date.now();
    const gymLogsUserId =
      existingGymLogsUser?._id ??
      (await ctx.db.insert("users", {
        clerkId: "system:gymlogs",
        name: "GymLogs",
        email: "gymlogs@system.local",
        username: "gymlogs",
        searchText: "gymlogs gym logs official workouts vorlagen",
        bio: "Offizielle GymLogs Workout-Vorlagen.",
        profileAccent: "orange",
        isPro: true,
        isPublic: true,
        allowMessages: false,
        showTrainingSummary: false,
        publicFields: {
          bio: true,
          location: true,
          favoriteLift: true,
          trainingGoal: true,
          heightCm: false,
          weightKg: false,
          birthDate: false,
          trainingSummary: false,
          trainingStreak: false,
          trainingBestSet: false,
          trainingActivity: false,
          trainingVolume: false,
        },
      }));

    const usernameReservation = await ctx.db
      .query("username_reservations")
      .withIndex("by_username", (q) => q.eq("username", "gymlogs"))
      .unique();
    if (!usernameReservation) {
      await ctx.db.insert("username_reservations", {
        username: "gymlogs",
        userId: gymLogsUserId,
        createdAt: now,
      });
    }

    const exercises = await ctx.db.query("exercises").collect();
    const exercisesByName = new Map(exercises.map((exercise) => [exercise.name.toLowerCase(), exercise]));
    let inserted = 0;
    let skipped = 0;

    for (const template of GYMLOGS_WORKOUT_TEMPLATES) {
      const existing = await ctx.db
        .query("workout_templates")
        .withIndex("by_user_created", (q) => q.eq("userId", gymLogsUserId))
        .order("desc")
        .take(50);
      if (existing.some((item) => item.name === template.name)) {
        skipped += 1;
        continue;
      }

      const templateExercises = template.exercises.map((entry) => {
        const exercise = exercisesByName.get(entry.name.toLowerCase());
        if (!exercise) throw new Error(`Missing exercise for GymLogs template: ${entry.name}`);
        return {
          exerciseId: exercise._id,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
          category: exercise.category,
          sets: entry.sets,
        };
      });

      await ctx.db.insert("workout_templates", {
        userId: gymLogsUserId,
        name: template.name,
        visibility: "public",
        showWeights: true,
        description: template.description,
        executionCount: template.executionCount,
        version: 1,
        exercises: templateExercises,
        createdAt: now - inserted * 60_000,
      });
      inserted += 1;
    }

    return `Seeded ${inserted} GymLogs workout templates, skipped ${skipped}`;
  },
});
