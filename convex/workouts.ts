import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const templateVisibility = v.union(
  v.literal("private"),
  v.literal("friends"),
  v.literal("public")
);

function estimated1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function toBodyPart(muscleGroup: string): string {
  if (
    muscleGroup === "quads" ||
    muscleGroup === "hamstrings" ||
    muscleGroup === "glutes" ||
    muscleGroup === "calves"
  ) {
    return "legs";
  }
  if (muscleGroup === "full_body" || muscleGroup === "cardio") {
    return "other";
  }
  if (
    muscleGroup === "chest" ||
    muscleGroup === "back" ||
    muscleGroup === "biceps" ||
    muscleGroup === "triceps" ||
    muscleGroup === "core" ||
    muscleGroup === "legs" ||
    muscleGroup === "shoulders"
  ) {
    return muscleGroup;
  }
  return "other";
}

const ONBOARDING_PRESETS = [
  {
    id: "full_body_beginner",
    name: "Ganzkoerper Anfaenger",
    description: "Ein einfacher Einstieg mit Grunduebungen fuer den ganzen Koerper.",
    duration: 45,
    goal: "general_fitness",
    split: "full_body",
    tags: ["beginner", "gym", "strength"],
    exercises: ["Squat", "Bench Press", "Lat Pulldown", "Overhead Press", "Plank"],
  },
  {
    id: "upper_60",
    name: "Oberkoerper 60 Min",
    description: "Brust, Ruecken, Schultern und Arme in einer fokussierten Einheit.",
    duration: 60,
    goal: "muscle_gain",
    split: "upper_lower",
    tags: ["gym", "bodybuilding", "upper"],
    exercises: ["Bench Press", "Barbell Row", "Overhead Press", "Lat Pulldown", "Tricep Pushdown", "Barbell Curl"],
  },
  {
    id: "lower_60",
    name: "Unterkoerper 60 Min",
    description: "Solide Unterkoerper-Einheit mit Squat-Fokus und Zubehoer.",
    duration: 60,
    goal: "strength",
    split: "upper_lower",
    tags: ["gym", "legs", "strength"],
    exercises: ["Squat", "Leg Press", "Leg Curl", "Hip Thrust", "Standing Calf Raise"],
  },
  {
    id: "push_day",
    name: "Push Day",
    description: "Druecken fuer Brust, Schultern und Trizeps.",
    duration: 60,
    goal: "muscle_gain",
    split: "push_pull_legs",
    tags: ["push", "gym", "bodybuilding"],
    exercises: ["Bench Press", "Incline Bench Press", "Overhead Press", "Lateral Raise", "Tricep Pushdown"],
  },
  {
    id: "pull_day",
    name: "Pull Day",
    description: "Ruecken und Bizeps mit starkem Zug-Fokus.",
    duration: 60,
    goal: "muscle_gain",
    split: "push_pull_legs",
    tags: ["pull", "gym", "bodybuilding"],
    exercises: ["Deadlift", "Pull-up", "Barbell Row", "Lat Pulldown", "Barbell Curl"],
  },
  {
    id: "leg_day",
    name: "Leg Day",
    description: "Beine schwer, sauber und gut strukturiert.",
    duration: 60,
    goal: "strength",
    split: "push_pull_legs",
    tags: ["legs", "gym", "powerlifting"],
    exercises: ["Squat", "Front Squat", "Leg Press", "Leg Curl", "Standing Calf Raise"],
  },
  {
    id: "short_30",
    name: "Kurzes 30-Minuten-Workout",
    description: "Kurze, dichte Einheit fuer Tage mit wenig Zeit.",
    duration: 30,
    goal: "general_fitness",
    split: "full_body",
    tags: ["short", "beginner", "home"],
    exercises: ["Squat", "Bench Press", "Barbell Row", "Plank"],
  },
] as const;

function inferTemplateDuration(template: { averageDurationMinutes?: number; exercises: Array<{ sets: unknown[] }> }) {
  return template.averageDurationMinutes ?? Math.min(90, Math.max(30, template.exercises.length * 10));
}

function inferTemplateSplit(template: { split?: string; name: string; description?: string; exercises: Array<{ category: string; muscleGroup: string }> }) {
  if (template.split) return template.split;
  const text = `${template.name} ${template.description ?? ""}`.toLowerCase();
  if (text.includes("push")) return "push_pull_legs";
  if (text.includes("pull")) return "push_pull_legs";
  if (text.includes("leg") || text.includes("unterkoerper")) return "push_pull_legs";
  if (text.includes("upper") || text.includes("oberkoerper") || text.includes("lower")) return "upper_lower";
  const categories = new Set(template.exercises.map((exercise) => exercise.category));
  if (categories.has("push") && categories.has("pull") && categories.has("legs")) return "full_body";
  return "custom";
}

function templateMatchScore(
  template: {
    name: string;
    description?: string;
    executionCount?: number;
    savedCount?: number;
    averageDurationMinutes?: number;
    trainingGoal?: string;
    split?: string;
    tags?: string[];
    exercises: Array<{ category: string; muscleGroup: string; sets: unknown[] }>;
  },
  preferences: {
    durationMinutes?: number;
    trainingGoal?: string;
    trainingGoals?: string[];
    preferredSplit?: string;
    interests?: string[];
  }
) {
  let score = (template.executionCount ?? 0) * 3 + (template.savedCount ?? 0) * 4;
  const duration = inferTemplateDuration(template);
  if (preferences.durationMinutes) {
    score += Math.max(0, 30 - Math.abs(duration - preferences.durationMinutes));
  }
  const goals = preferences.trainingGoals?.length ? preferences.trainingGoals : preferences.trainingGoal ? [preferences.trainingGoal] : [];
  if (template.trainingGoal && goals.includes(template.trainingGoal)) score += 18;
  const split = inferTemplateSplit(template);
  if (preferences.preferredSplit && split === preferences.preferredSplit) score += 18;
  const haystack = `${template.name} ${template.description ?? ""} ${(template.tags ?? []).join(" ")}`.toLowerCase();
  for (const interest of preferences.interests ?? []) {
    if (haystack.includes(interest.toLowerCase())) score += 8;
  }
  return score;
}

export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .take(args.limit ?? 20);

    return await Promise.all(
      workouts.map(async (workout) => {
        const sets = await ctx.db
          .query("sets")
          .withIndex("by_workout", (q) => q.eq("workoutId", workout._id))
          .collect();

        const muscleGroups = new Set<string>();
        for (const set of sets) {
          const exercise = await ctx.db.get(set.exerciseId);
          if (exercise) muscleGroups.add(toBodyPart(exercise.muscleGroup));
        }

        return {
          ...workout,
          totalVolume: sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
          totalSets: sets.length,
          muscleGroups: Array.from(muscleGroups),
        };
      })
    );
  },
});

export const getRecent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workouts")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .take(args.limit ?? 5);
  },
});

export const get = query({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) return null;

    const sets = await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    // Group sets by exercise
    const exerciseMap = new Map<
      Id<"exercises">,
      {
        exerciseId: Id<"exercises">;
        exercise: {
          name: string;
          muscleGroup: string;
          category: string;
          bodygraphZones?: string[];
        } | null;
        sets: Array<
          typeof sets[number] & {
            previous?: { weight: number; reps: number };
            isPr: boolean;
          }
        >;
      }
    >();

    for (const set of sets) {
      const eid = set.exerciseId;
      if (!exerciseMap.has(eid)) {
        const exercise = await ctx.db.get(set.exerciseId);
        exerciseMap.set(eid, {
          exerciseId: eid,
          exercise: exercise
            ? {
                name: exercise.name,
                muscleGroup: exercise.muscleGroup,
                category: exercise.category,
                bodygraphZones: exercise.bodygraphZones,
              }
            : null,
          sets: [],
        });
      }
      const previousSets = await ctx.db
        .query("sets")
        .withIndex("by_user_exercise", (q) =>
          q.eq("userId", set.userId).eq("exerciseId", set.exerciseId)
        )
        .order("desc")
        .take(100);

      const previous = previousSets.find(
        (previousSet) =>
          previousSet.workoutId !== args.workoutId &&
          previousSet.setOrder === set.setOrder
      );
      const isPr =
        !previous ||
        set.weight * set.reps > previous.weight * previous.reps ||
        estimated1RM(set.weight, set.reps) >
          estimated1RM(previous.weight, previous.reps);

      exerciseMap.get(eid)?.sets.push({
        ...set,
        previous: previous
          ? { weight: previous.weight, reps: previous.reps }
          : undefined,
        isPr,
      });
    }

    const exercises = Array.from(exerciseMap.values());
    // Sort sets by setOrder within each exercise
    for (const ex of exercises) {
      ex.sets.sort((a, b) => a.setOrder - b.setOrder);
    }

    const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

    return { ...workout, exercises, totalVolume };
  },
});

export const getIncomplete = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isCompleted"), false))
      .first();
  },
});

export const create = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workouts", {
      userId: args.userId,
      date: Date.now(),
      isCompleted: false,
    });
  },
});

export const resetEmptyStart = mutation({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.isCompleted) return null;

    const existingSet = await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .first();

    if (existingSet) return workout._id;

    await ctx.db.patch(args.workoutId, { date: Date.now() });
    return workout._id;
  },
});

export const complete = mutation({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) return;
    const completedAt = Date.now();
    const durationMinutes = Math.max(1, Math.round((completedAt - workout.date) / (60 * 1000)));
    if (!workout.isCompleted && workout.sourceTemplateId) {
      const template = await ctx.db.get(workout.sourceTemplateId);
      if (template) {
        await ctx.db.patch(template._id, {
          executionCount: (template.executionCount ?? 0) + 1,
        });
      }
    }
    await ctx.db.patch(args.workoutId, { isCompleted: true, date: completedAt, durationMinutes });
  },
});

export const saveAsTemplate = mutation({
  args: {
    workoutId: v.id("workouts"),
    name: v.string(),
    visibility: v.optional(templateVisibility),
    showWeights: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) throw new Error("Workout not found.");
    if (!workout.isCompleted) {
      throw new Error("Only completed workouts can be saved as templates.");
    }

    const sets = await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    const exerciseMap = new Map<
      string,
      {
        exerciseId: typeof sets[number]["exerciseId"];
        exerciseName: string;
        muscleGroup: string;
        category: string;
        sets: { weight: number; reps: number }[];
      }
    >();

    for (const set of sets) {
      const exercise = await ctx.db.get(set.exerciseId);
      if (!exercise) continue;

      const key = set.exerciseId;
      if (!exerciseMap.has(key)) {
        exerciseMap.set(key, {
          exerciseId: set.exerciseId,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
          category: exercise.category,
          sets: [],
        });
      }

      exerciseMap.get(key)?.sets.push({
        weight: set.weight,
        reps: set.reps,
      });
    }

    return await ctx.db.insert("workout_templates", {
      userId: workout.userId,
      name: args.name.trim().slice(0, 80),
      sourceWorkoutId: args.workoutId,
      visibility: args.visibility ?? "private",
      showWeights: args.showWeights ?? false,
      description: args.description?.trim().slice(0, 180),
      exercises: Array.from(exerciseMap.values()),
      createdAt: Date.now(),
    });
  },
});

export const updateTemplateVisibility = mutation({
  args: {
    templateId: v.id("workout_templates"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    visibility: templateVisibility,
    showWeights: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== args.userId) {
      throw new Error("Template not found.");
    }

    await ctx.db.patch(args.templateId, {
      name: args.name?.trim().slice(0, 80) || template.name,
      visibility: args.visibility,
      showWeights: args.showWeights,
      description: args.description?.trim().slice(0, 180),
    });
  },
});

export const deleteTemplate = mutation({
  args: {
    templateId: v.id("workout_templates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== args.userId) {
      throw new Error("Template not found.");
    }

    await ctx.db.delete(args.templateId);
    return true;
  },
});

async function areFriends(
  ctx: QueryCtx | MutationCtx,
  a: Id<"users">,
  b: Id<"users">
) {
  const requesterId = a < b ? a : b;
  const addresseeId = a < b ? b : a;
  const friendship = await ctx.db
    .query("friends")
    .withIndex("by_pair", (q) =>
      q.eq("requesterId", requesterId).eq("addresseeId", addresseeId)
    )
    .unique();
  return friendship?.status === "accepted";
}

async function canUseTemplate(
  ctx: QueryCtx | MutationCtx,
  templateUserId: Id<"users">,
  viewerId: Id<"users">
) {
  if (templateUserId === viewerId) return true;
  return await areFriends(ctx, templateUserId, viewerId);
}

export const listProfileTemplates = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const isSelf = args.viewerId === args.userId;
    const canSeeFriends = args.viewerId
      ? isSelf || (await areFriends(ctx, args.userId, args.viewerId))
      : false;

    const templates = await ctx.db
      .query("workout_templates")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 12);

    return templates
      .filter((template) => {
        const visibility = template.visibility ?? "private";
        if (isSelf) return true;
        if (visibility === "public") return true;
        if (visibility === "friends") return canSeeFriends;
        return false;
      })
      .map((template) => {
        const showWeights = isSelf || template.showWeights === true;
        return {
          ...template,
          visibility: template.visibility ?? "private",
          showWeights: template.showWeights ?? false,
          executionCount: template.executionCount ?? 0,
          exercises: template.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) => ({
              reps: set.reps,
              weight: showWeights ? set.weight : null,
            })),
          })),
          totalExercises: template.exercises.length,
          totalSets: template.exercises.reduce(
            (sum, exercise) => sum + exercise.sets.length,
            0
          ),
          totalVolume: showWeights
            ? template.exercises.reduce(
                (sum, exercise) =>
                  sum +
                  exercise.sets.reduce(
                    (exerciseSum, set) => exerciseSum + set.weight * set.reps,
                    0
                  ),
                0
              )
            : null,
        };
      });
  },
});

export const listOnboardingRecommendations = query({
  args: {
    durationMinutes: v.optional(v.number()),
    trainingGoal: v.optional(v.string()),
    trainingGoals: v.optional(v.array(v.string())),
    preferredSplit: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 6, 1), 12);
    const templates = await ctx.db
      .query("workout_templates")
      .withIndex("by_visibility_and_created", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(80);

    const ranked = templates
      .map((template) => ({
        template,
        score: templateMatchScore(template, {
          durationMinutes: args.durationMinutes,
          trainingGoal: args.trainingGoal,
          trainingGoals: args.trainingGoals,
          preferredSplit: args.preferredSplit,
          interests: args.interests,
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return await Promise.all(
      ranked.map(async ({ template, score }) => {
        const creator = await ctx.db.get(template.userId);
        const avatarUrl = creator?.avatarStorageId
          ? await ctx.storage.getUrl(creator.avatarStorageId)
          : null;
        const duration = inferTemplateDuration(template);
        const split = inferTemplateSplit(template);
        const repeatedWorkouts = await ctx.db
          .query("workouts")
          .withIndex("by_source_template_completed", (q) =>
            q.eq("sourceTemplateId", template._id).eq("isCompleted", true)
          )
          .order("desc")
          .take(8);
        const durationSamples = repeatedWorkouts
          .filter((workout) => typeof workout.durationMinutes === "number")
          .slice(0, 4);
        const durationValues = durationSamples.map((workout) => workout.durationMinutes as number);
        const durationRangeMinutes = durationValues.length
          ? {
              min: Math.min(...durationValues),
              max: Math.max(...durationValues),
            }
          : null;
        const repeatSamples = await Promise.all(
          durationSamples.slice(0, 3).map(async (workout) => {
            const repeater = await ctx.db.get(workout.userId);
            return {
              name: repeater?.name ?? "GymLogs User",
              username: repeater?.username,
              durationMinutes: workout.durationMinutes as number,
            };
          })
        );

        return {
          id: template._id,
          kind: "community" as const,
          title: template.name,
          description: template.description,
          durationMinutes: duration,
          trainingGoal: template.trainingGoal,
          split,
          totalExercises: template.exercises.length,
          saves: template.savedCount ?? 0,
          repeats: template.executionCount ?? 0,
          durationRangeMinutes,
          repeatSamples,
          creator: creator
            ? {
                id: creator._id,
                name: creator.name,
                username: creator.username,
                avatarUrl: avatarUrl ?? creator.avatarUrl,
              }
            : null,
          tags: template.tags ?? [],
          score,
        };
      })
    );
  },
});

async function presetExercises(ctx: MutationCtx, exerciseNames: readonly string[]) {
  const exercises = await ctx.db.query("exercises").take(500);
  return exerciseNames.map((exerciseName) => {
    const exercise = exercises.find((entry) => entry.name.toLowerCase() === exerciseName.toLowerCase());
    if (!exercise) throw new Error(`Exercise missing from catalog: ${exerciseName}`);
    return {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      category: exercise.category,
      sets: [
        { weight: 0, reps: exercise.name.toLowerCase() === "plank" ? 30 : 10 },
        { weight: 0, reps: exercise.name.toLowerCase() === "plank" ? 30 : 10 },
        { weight: 0, reps: exercise.name.toLowerCase() === "plank" ? 30 : 10 },
      ],
    };
  });
}

export const saveRecommendedTemplate = mutation({
  args: {
    userId: v.id("users"),
    templateId: v.optional(v.id("workout_templates")),
    presetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.templateId) {
      const template = await ctx.db.get(args.templateId);
      if (!template) throw new Error("Template not found.");
      if ((template.visibility ?? "private") !== "public" && template.userId !== args.userId) {
        throw new Error("Template not available.");
      }

      const inserted = await ctx.db.insert("workout_templates", {
        userId: args.userId,
        name: template.name,
        sourceWorkoutId: template.sourceWorkoutId,
        visibility: "private",
        showWeights: template.showWeights ?? false,
        description: template.description,
        executionCount: 0,
        savedCount: 0,
        averageDurationMinutes: template.averageDurationMinutes,
        trainingGoal: template.trainingGoal,
        split: template.split,
        tags: template.tags,
        exercises: template.exercises,
        createdAt: Date.now(),
      });

      if (template.userId !== args.userId) {
        await ctx.db.patch(template._id, {
          savedCount: (template.savedCount ?? 0) + 1,
        });
      }

      return inserted;
    }

    const preset = ONBOARDING_PRESETS.find((entry) => entry.id === args.presetId);
    if (!preset) throw new Error("Template not found.");

    return await ctx.db.insert("workout_templates", {
      userId: args.userId,
      name: preset.name,
      visibility: "private",
      showWeights: false,
      description: preset.description,
      executionCount: 0,
      savedCount: 0,
      averageDurationMinutes: preset.duration,
      trainingGoal: preset.goal,
      split: preset.split,
      tags: [...preset.tags],
      exercises: await presetExercises(ctx, preset.exercises),
      createdAt: Date.now(),
    });
  },
});

export const getTemplateForStart = query({
  args: {
    templateId: v.id("workout_templates"),
    viewerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) return null;

    const visibility = template.visibility ?? "private";
    const isSelf = template.userId === args.viewerId;
    const canSee =
      isSelf ||
      visibility === "public" ||
      (visibility === "friends" &&
        (await canUseTemplate(ctx, template.userId, args.viewerId)));

    if (!canSee) return null;

    const showWeights = isSelf || template.showWeights === true;
    return {
      _id: template._id,
      userId: template.userId,
      name: template.name,
      description: template.description,
      visibility,
      showWeights: template.showWeights ?? false,
      executionCount: template.executionCount ?? 0,
      exercises: template.exercises.map((exercise) => ({
        exerciseName: exercise.exerciseName,
        muscleGroup: exercise.muscleGroup,
        category: exercise.category,
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weight: showWeights ? set.weight : null,
        })),
      })),
      totalExercises: template.exercises.length,
      totalSets: template.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0
      ),
      totalVolume: showWeights
        ? template.exercises.reduce(
            (sum, exercise) =>
              sum +
              exercise.sets.reduce(
                (exerciseSum, set) => exerciseSum + set.weight * set.reps,
                0
              ),
            0
          )
        : null,
    };
  },
});

export const startFromTemplate = mutation({
  args: {
    templateId: v.id("workout_templates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found.");

    const visibility = template.visibility ?? "private";
    const canStart =
      template.userId === args.userId ||
      visibility === "public" ||
      (visibility === "friends" &&
        (await canUseTemplate(ctx, template.userId, args.userId)));

    if (!canStart) throw new Error("Template not available.");

    const includeWeights =
      template.userId === args.userId || template.showWeights === true;
    const workoutId = await ctx.db.insert("workouts", {
      userId: args.userId,
      date: Date.now(),
      notes: `From template: ${template.name}`,
      sourceTemplateId: template._id,
      isCompleted: false,
    });

    let setOrder = 0;
    for (const exercise of template.exercises) {
      for (const set of exercise.sets) {
        await ctx.db.insert("sets", {
          workoutId,
          exerciseId: exercise.exerciseId,
          userId: args.userId,
          weight: includeWeights ? set.weight : 0,
          reps: set.reps,
          setOrder,
          createdAt: Date.now(),
        });
        setOrder += 1;
      }
    }

    return workoutId;
  },
});

export const updateNotes = mutation({
  args: { workoutId: v.id("workouts"), notes: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workoutId, { notes: args.notes });
  },
});

export const remove = mutation({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    // Delete all sets in this workout
    const sets = await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();
    for (const set of sets) {
      await ctx.db.delete(set._id);
    }
    await ctx.db.delete(args.workoutId);
  },
});
