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
      Record<string, { sets: number; volume: number }>
    >();

    for (const set of sets) {
      const weekStart = startOfWeek(set.createdAt);
      if (!weekMap.has(weekStart)) weekMap.set(weekStart, {});
      const weekData = weekMap.get(weekStart)!;

      // We need the exercise's muscle group
      const exercise = await ctx.db.get(set.exerciseId);
      const group = toBodyPart(exercise?.muscleGroup ?? "other");
      weekData[group] = weekData[group] ?? { sets: 0, volume: 0 };
      weekData[group].sets += 1;
      weekData[group].volume += set.weight * set.reps;
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

function startOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfYear(ts: number): number {
  const d = new Date(ts);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const getWorkoutFrequency = query({
  args: {
    userId: v.id("users"),
    period: v.union(v.literal("week"), v.literal("month"), v.literal("year")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const start =
      args.period === "week"
        ? startOfWeek(now)
        : args.period === "month"
          ? startOfMonth(now)
          : startOfYear(now);

    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("date", start)
      )
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    if (args.period === "week") {
      const buckets = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(date.getDate() + index);
        return {
          bucketStart: date.getTime(),
          count: 0,
        };
      });

      for (const workout of workouts) {
        const dayIndex = Math.floor((workout.date - start) / (24 * 60 * 60 * 1000));
        if (buckets[dayIndex]) buckets[dayIndex].count += 1;
      }

      return { total: workouts.length, buckets };
    }

    if (args.period === "month") {
      const monthStart = new Date(start);
      const nextMonth = new Date(monthStart);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const buckets = [];
      for (
        let cursor = startOfWeek(monthStart.getTime());
        cursor < nextMonth.getTime();
        cursor += 7 * 24 * 60 * 60 * 1000
      ) {
        buckets.push({ bucketStart: cursor, count: 0 });
      }

      for (const workout of workouts) {
        const weekStart = startOfWeek(workout.date);
        const bucket = buckets.find((item) => item.bucketStart === weekStart);
        if (bucket) bucket.count += 1;
      }

      return { total: workouts.length, buckets };
    }

    const buckets = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(start);
      date.setMonth(index, 1);
      return {
        bucketStart: date.getTime(),
        count: 0,
      };
    });

    for (const workout of workouts) {
      const monthIndex = new Date(workout.date).getMonth();
      buckets[monthIndex].count += 1;
    }

    return { total: workouts.length, buckets };
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
