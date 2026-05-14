import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
      string,
      { exerciseId: string; exercise: { name: string; muscleGroup: string; category: string } | null; sets: typeof sets }
    >();

    for (const set of sets) {
      const eid = set.exerciseId;
      if (!exerciseMap.has(eid)) {
        const exercise = await ctx.db.get(set.exerciseId);
        exerciseMap.set(eid, {
          exerciseId: eid,
          exercise: exercise
            ? { name: exercise.name, muscleGroup: exercise.muscleGroup, category: exercise.category }
            : null,
          sets: [],
        });
      }
      exerciseMap.get(eid)?.sets.push(set);
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

export const complete = mutation({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workoutId, { isCompleted: true, date: Date.now() });
  },
});

export const saveAsTemplate = mutation({
  args: {
    workoutId: v.id("workouts"),
    name: v.string(),
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
      name: args.name.trim(),
      sourceWorkoutId: args.workoutId,
      exercises: Array.from(exerciseMap.values()),
      createdAt: Date.now(),
    });
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
