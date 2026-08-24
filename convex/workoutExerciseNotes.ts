import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkoutOwner, sanitizeText } from "./authz";

export const listForWorkout = query({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    await requireWorkoutOwner(ctx, args.workoutId);
    return await ctx.db
      .query("workout_exercise_notes")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .take(100);
  },
});

export const set = mutation({
  args: {
    workoutId: v.id("workouts"),
    exerciseId: v.id("exercises"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const workout = await requireWorkoutOwner(ctx, args.workoutId);
    if (workout.isCompleted) {
      throw new Error("Completed workouts cannot be edited.");
    }

    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) throw new Error("Exercise not found.");

    const existing = await ctx.db
      .query("workout_exercise_notes")
      .withIndex("by_workout_and_exercise", (q) =>
        q.eq("workoutId", args.workoutId).eq("exerciseId", args.exerciseId)
      )
      .first();

    const body = sanitizeText(args.body, 1000);
    if (!body) {
      if (existing) await ctx.db.delete(existing._id);
      return null;
    }

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        body,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("workout_exercise_notes", {
      workoutId: args.workoutId,
      exerciseId: args.exerciseId,
      userId: workout.userId,
      body,
      createdAt: now,
      updatedAt: now,
    });
  },
});
