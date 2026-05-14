import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getForWorkout = query({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();
  },
});

export const getLastPerformance = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
    currentWorkoutId: v.optional(v.id("workouts")),
  },
  handler: async (ctx, args) => {
    // Get the most recent sets for this exercise by this user (excluding current workout)
    const allSets = await ctx.db
      .query("sets")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", args.userId).eq("exerciseId", args.exerciseId)
      )
      .order("desc")
      .take(100);

    // Find the most recent workout that isn't the current one
    let lastWorkoutId: typeof allSets[number]["workoutId"] | null = null;
    for (const set of allSets) {
      if (args.currentWorkoutId && set.workoutId === args.currentWorkoutId)
        continue;
      lastWorkoutId = set.workoutId;
      break;
    }

    if (!lastWorkoutId) return null;

    const lastSets = allSets
      .filter((s) => s.workoutId === lastWorkoutId)
      .sort((a, b) => a.setOrder - b.setOrder);

    const workout = await ctx.db.get(lastWorkoutId);

    return {
      date: workout?.date ?? 0,
      sets: lastSets,
    };
  },
});

export const add = mutation({
  args: {
    workoutId: v.id("workouts"),
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
    weight: v.number(),
    reps: v.number(),
    notes: v.optional(v.string()),
    restSeconds: v.optional(v.number()),
    setOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sets", {
      workoutId: args.workoutId,
      exerciseId: args.exerciseId,
      userId: args.userId,
      weight: args.weight,
      reps: args.reps,
      notes: args.notes?.trim() || undefined,
      restSeconds: args.restSeconds,
      setOrder: args.setOrder,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    setId: v.id("sets"),
    weight: v.number(),
    reps: v.number(),
    notes: v.optional(v.string()),
    restSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.setId, {
      weight: args.weight,
      reps: args.reps,
      notes: args.notes?.trim() || undefined,
      restSeconds: args.restSeconds,
    });
  },
});

export const remove = mutation({
  args: { setId: v.id("sets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.setId);
  },
});

export const removeForExercise = mutation({
  args: {
    workoutId: v.id("workouts"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const sets = await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    for (const set of sets) {
      if (set.exerciseId === args.exerciseId) {
        await ctx.db.delete(set._id);
      }
    }
  },
});
