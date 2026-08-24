import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  requireFinitePositiveNumber,
  requirePositiveInteger,
  requireSetOwner,
  requireUserMatch,
  requireWorkoutOwner,
  sanitizeText,
} from "./authz";

function boundedRestSeconds(value: number | undefined) {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) {
    throw new Error("Rest seconds is outside the allowed range.");
  }
  return Math.max(0, Math.min(900, Math.round(value)));
}

function boundedSetOrder(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 500) {
    throw new Error("Set order is outside the allowed range.");
  }
  return value;
}

export const getForWorkout = query({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    await requireWorkoutOwner(ctx, args.workoutId);
    return await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .take(400);
  },
});

export const getLastPerformance = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
    currentWorkoutId: v.optional(v.id("workouts")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserMatch(ctx, args.userId);
    // Get the most recent sets for this exercise by this user (excluding current workout)
    const allSets = await ctx.db
      .query("sets")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", args.exerciseId)
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
    const userId = await requireUserMatch(ctx, args.userId);
    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== userId) {
      throw new Error("Workout not found.");
    }
    if (workout.isCompleted) {
      throw new Error("Completed workouts cannot be edited.");
    }

    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) throw new Error("Exercise not found.");

    const weight = requireFinitePositiveNumber(args.weight, "Weight", 1000);
    const reps = requirePositiveInteger(args.reps, "Reps", 200);
    const now = Date.now();

    return await ctx.db.insert("sets", {
      workoutId: args.workoutId,
      exerciseId: args.exerciseId,
      userId,
      weight,
      reps,
      notes: sanitizeText(args.notes, 240),
      restSeconds: boundedRestSeconds(args.restSeconds),
      setOrder: boundedSetOrder(args.setOrder),
      createdAt: now,
      updatedAt: now,
      completedAt: now,
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
    const set = await requireSetOwner(ctx, args.setId);
    const workout = await ctx.db.get(set.workoutId);
    if (!workout || workout.isCompleted) {
      throw new Error("Completed workouts cannot be edited.");
    }

    await ctx.db.patch(args.setId, {
      weight: requireFinitePositiveNumber(args.weight, "Weight", 1000),
      reps: requirePositiveInteger(args.reps, "Reps", 200),
      notes: sanitizeText(args.notes, 240),
      restSeconds: boundedRestSeconds(args.restSeconds),
      updatedAt: Date.now(),
      completedAt: set.completedAt ?? Date.now(),
    });
  },
});

export const remove = mutation({
  args: { setId: v.id("sets") },
  handler: async (ctx, args) => {
    const set = await requireSetOwner(ctx, args.setId);
    const workout = await ctx.db.get(set.workoutId);
    if (!workout || workout.isCompleted) {
      throw new Error("Completed workouts cannot be edited.");
    }
    await ctx.db.delete(args.setId);
  },
});

export const removeForExercise = mutation({
  args: {
    workoutId: v.id("workouts"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const workout = await requireWorkoutOwner(ctx, args.workoutId);
    if (workout.isCompleted) {
      throw new Error("Completed workouts cannot be edited.");
    }

    const sets = await ctx.db
      .query("sets")
      .withIndex("by_workout_and_exercise", (q) =>
        q.eq("workoutId", args.workoutId).eq("exerciseId", args.exerciseId)
      )
      .take(500);

    for (const set of sets) {
      await ctx.db.delete(set._id);
    }
  },
});
