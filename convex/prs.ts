import { query } from "./_generated/server";
import { v } from "convex/values";

function estimated1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export const getForExercise = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const sets = await ctx.db
      .query("sets")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", args.userId).eq("exerciseId", args.exerciseId)
      )
      .collect();

    if (sets.length === 0) return null;

    let heaviestWeight = 0;
    let best1RM = 0;
    let highestVolume = 0;
    const repsByWeight = new Map<number, number>();

    for (const set of sets) {
      if (set.weight > heaviestWeight) heaviestWeight = set.weight;
      const e1rm = estimated1RM(set.weight, set.reps);
      if (e1rm > best1RM) best1RM = e1rm;
      const vol = set.weight * set.reps;
      if (vol > highestVolume) highestVolume = vol;
      const existing = repsByWeight.get(set.weight) ?? 0;
      if (set.reps > existing) repsByWeight.set(set.weight, set.reps);
    }

    return {
      heaviestWeight,
      best1RM: Math.round(best1RM * 10) / 10,
      highestVolume,
      mostRepsAtWeight: Array.from(repsByWeight.entries()).map(
        ([weight, reps]) => ({ weight, reps })
      ),
    };
  },
});

export const getRecent = query({
  args: {
    userId: v.id("users"),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    // Get sets from the last N days
    const recentSets = await ctx.db
      .query("sets")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", args.userId).gte("createdAt", args.since)
      )
      .collect();

    if (recentSets.length === 0) return [];

    // Get all-time PRs per exercise
    const exerciseIds = [...new Set(recentSets.map((s) => s.exerciseId))];
    const prs: Array<{
      exerciseId: string;
      exerciseName: string;
      type: "weight" | "1rm" | "volume";
      value: number;
      date: number;
    }> = [];

    for (const exerciseId of exerciseIds) {
      const allSets = await ctx.db
        .query("sets")
        .withIndex("by_user_exercise", (q) =>
          q.eq("userId", args.userId).eq("exerciseId", exerciseId)
        )
        .collect();

      const exercise = await ctx.db.get(exerciseId);
      if (!exercise) continue;

      let allTimeWeight = 0;
      let allTime1RM = 0;
      let allTimeVolume = 0;

      for (const s of allSets) {
        if (s.weight > allTimeWeight) allTimeWeight = s.weight;
        const e1rm = estimated1RM(s.weight, s.reps);
        if (e1rm > allTime1RM) allTime1RM = e1rm;
        const vol = s.weight * s.reps;
        if (vol > allTimeVolume) allTimeVolume = vol;
      }

      for (const s of recentSets.filter((rs) => rs.exerciseId === exerciseId)) {
        const workout = await ctx.db.get(s.workoutId);
        const date = workout?.date ?? s.createdAt;

        if (s.weight >= allTimeWeight) {
          prs.push({
            exerciseId,
            exerciseName: exercise.name,
            type: "weight",
            value: s.weight,
            date,
          });
        }
        const e1rm = estimated1RM(s.weight, s.reps);
        if (e1rm >= allTime1RM) {
          prs.push({
            exerciseId,
            exerciseName: exercise.name,
            type: "1rm",
            value: Math.round(e1rm * 10) / 10,
            date,
          });
        }
      }
    }

    // Deduplicate — keep one PR per exercise per type (most recent)
    const seen = new Set<string>();
    const unique = prs.filter((pr) => {
      const key = `${pr.exerciseId}-${pr.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => b.date - a.date).slice(0, 10);
  },
});

export const checkSet = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
    weight: v.number(),
    reps: v.number(),
  },
  handler: async (ctx, args) => {
    const sets = await ctx.db
      .query("sets")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", args.userId).eq("exerciseId", args.exerciseId)
      )
      .collect();

    if (sets.length === 0) {
      return { isHeaviest: true, isBest1RM: true, isMostReps: false };
    }

    let maxWeight = 0;
    let max1RM = 0;
    let maxRepsAtThisWeight = 0;

    for (const s of sets) {
      if (s.weight > maxWeight) maxWeight = s.weight;
      const e1rm = estimated1RM(s.weight, s.reps);
      if (e1rm > max1RM) max1RM = e1rm;
      if (s.weight === args.weight && s.reps > maxRepsAtThisWeight) {
        maxRepsAtThisWeight = s.reps;
      }
    }

    return {
      isHeaviest: args.weight >= maxWeight,
      isBest1RM: estimated1RM(args.weight, args.reps) >= max1RM,
      isMostReps: args.reps > maxRepsAtThisWeight,
    };
  },
});
