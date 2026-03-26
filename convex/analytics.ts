import { query } from "./_generated/server";
import { v } from "convex/values";

function startOfWeek(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // Monday-based
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const getWeeklyVolume = query({
  args: {
    userId: v.id("users"),
    weeks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numWeeks = args.weeks ?? 8;
    const since = Date.now() - numWeeks * 7 * 24 * 60 * 60 * 1000;

    const sets = await ctx.db
      .query("sets")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", args.userId).gte("createdAt", since)
      )
      .collect();

    const weekMap = new Map<
      number,
      Record<string, number>
    >();

    for (const set of sets) {
      const weekStart = startOfWeek(set.createdAt);
      if (!weekMap.has(weekStart)) weekMap.set(weekStart, {});
      const weekData = weekMap.get(weekStart)!;

      // We need the exercise's muscle group
      const exercise = await ctx.db.get(set.exerciseId);
      const group = exercise?.muscleGroup ?? "other";
      weekData[group] = (weekData[group] ?? 0) + set.weight * set.reps;
    }

    return Array.from(weekMap.entries())
      .map(([weekStart, volumes]) => ({ weekStart, volumes }))
      .sort((a, b) => a.weekStart - b.weekStart);
  },
});

export const getWorkoutsPerWeek = query({
  args: {
    userId: v.id("users"),
    weeks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numWeeks = args.weeks ?? 12;
    const since = Date.now() - numWeeks * 7 * 24 * 60 * 60 * 1000;

    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("date", since)
      )
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    const weekMap = new Map<number, number>();

    for (const w of workouts) {
      const weekStart = startOfWeek(w.date);
      weekMap.set(weekStart, (weekMap.get(weekStart) ?? 0) + 1);
    }

    return Array.from(weekMap.entries())
      .map(([weekStart, count]) => ({ weekStart, count }))
      .sort((a, b) => a.weekStart - b.weekStart);
  },
});

export const getTotalStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    const sets = await ctx.db
      .query("sets")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .collect();

    const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

    const memberSince =
      workouts.length > 0
        ? Math.min(...workouts.map((w) => w.date))
        : Date.now();

    return {
      totalWorkouts: workouts.length,
      totalSets: sets.length,
      totalVolume,
      memberSince,
    };
  },
});
