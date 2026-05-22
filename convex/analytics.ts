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
    muscleGroup === "quads" ||
    muscleGroup === "hamstrings" ||
    muscleGroup === "calves" ||
    muscleGroup === "glutes" ||
    muscleGroup === "shoulders"
  ) {
    return muscleGroup;
  }
  return "other";
}

const BODY_PARTS = [
  "chest",
  "back",
  "biceps",
  "triceps",
  "core",
  "legs",
  "quads",
  "hamstrings",
  "calves",
  "glutes",
  "shoulders",
  "other",
] as const;

type BodyPart = (typeof BODY_PARTS)[number];

function emptyMuscleTotals(): Record<BodyPart, { sets: number; volume: number; exercises: string[] }> {
  return Object.fromEntries(
    BODY_PARTS.map((part) => [part, { sets: 0, volume: 0, exercises: [] }])
  ) as unknown as Record<BodyPart, { sets: number; volume: number; exercises: string[] }>;
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
      .take(500);

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
      .take(200);

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
      .take(200);

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

export const getMuscleAnalytics = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const currentStart = startOfWeek(now);
    const previousStart = currentStart - 7 * 24 * 60 * 60 * 1000;

    const sets = await ctx.db
      .query("sets")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", args.userId).gte("createdAt", previousStart)
      )
      .take(500);

    const current = emptyMuscleTotals();
    const previous = emptyMuscleTotals();
    const bodyGraphZoneCurrent = Object.fromEntries(
      BODY_PARTS.map((part) => [part, 0])
    ) as Record<BodyPart, number>;
    const zoneExercisesCurrent = Object.fromEntries(
      BODY_PARTS.map((part) => [part, new Map<string, number>()])
    ) as Record<BodyPart, Map<string, number>>;

    const workoutCompletionCache = new Map<string, boolean>();
    const exerciseCache = new Map<
      string,
      | {
          name: string;
          muscleGroup: string;
          bodygraphZones?: string[];
        }
      | null
    >();

    for (const set of sets) {
      let isCompleted = workoutCompletionCache.get(set.workoutId);
      if (isCompleted === undefined) {
        const workout = await ctx.db.get(set.workoutId);
        isCompleted = workout?.isCompleted === true;
        workoutCompletionCache.set(set.workoutId, isCompleted);
      }
      if (!isCompleted) continue;

      let exercise = exerciseCache.get(set.exerciseId);
      if (exercise === undefined) {
        const exerciseDoc = await ctx.db.get(set.exerciseId);
        exercise = exerciseDoc
          ? {
              name: exerciseDoc.name,
              muscleGroup: exerciseDoc.muscleGroup,
              bodygraphZones: exerciseDoc.bodygraphZones,
            }
          : null;
        exerciseCache.set(set.exerciseId, exercise);
      }
      const bodyPart = toBodyPart(exercise?.muscleGroup ?? "other") as BodyPart;
      const target = set.createdAt >= currentStart ? current : previous;
      target[bodyPart].sets += 1;
      target[bodyPart].volume += set.weight * set.reps;
      if (exercise && !target[bodyPart].exercises.includes(exercise.name)) {
        target[bodyPart].exercises.push(exercise.name);
      }

      if (set.createdAt >= currentStart) {
        const zones =
          exercise?.bodygraphZones && exercise.bodygraphZones.length > 0
            ? exercise.bodygraphZones.map(
                (z) => toBodyPart(z) as BodyPart
              )
            : [bodyPart];
        for (const zone of zones) {
          bodyGraphZoneCurrent[zone] += 1;
          if (exercise) {
            const map = zoneExercisesCurrent[zone];
            map.set(exercise.name, (map.get(exercise.name) ?? 0) + 1);
          }
        }
      }
    }

    const bodyParts = BODY_PARTS.map((part) => {
      const currentSets = current[part].sets;
      const previousSets = previous[part].sets;
      const targetMin = part === "other" ? 0 : 6;
      const targetMax = part === "other" ? 6 : 14;
      const status =
        currentSets === 0
          ? "missing"
          : currentSets < targetMin
            ? "low"
            : currentSets > targetMax
              ? "high"
              : "balanced";

      return {
        part,
        sets: currentSets,
        volume: current[part].volume,
        exercises: current[part].exercises.slice(0, 5),
        previousSets,
        setDelta: currentSets - previousSets,
        targetMin,
        targetMax,
        status,
      };
    });

    const exercisesByZone = Object.fromEntries(
      Object.entries(zoneExercisesCurrent).map(([zone, map]) => [
        zone,
        Array.from(map.entries())
          .map(([name, sets]) => ({ name, sets }))
          .sort((a, b) => b.sets - a.sets),
      ])
    ) as Record<BodyPart, Array<{ name: string; sets: number }>>;

    return {
      weekStart: currentStart,
      previousWeekStart: previousStart,
      bodyParts,
      bodyGraphZoneSets: bodyGraphZoneCurrent,
      exercisesByZone,
      totalSets: bodyParts.reduce((sum, part) => sum + part.sets, 0),
      totalVolume: bodyParts.reduce((sum, part) => sum + part.volume, 0),
    };
  },
});

export const getTotalStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .take(500);

    const sets = await ctx.db
      .query("sets")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1000);

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
