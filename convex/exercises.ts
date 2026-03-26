import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (!args.query.trim()) {
      return await ctx.db.query("exercises").take(args.limit ?? 50);
    }
    return await ctx.db
      .query("exercises")
      .withSearchIndex("search_by_name", (q) =>
        q.search("name", args.query)
      )
      .take(args.limit ?? 20);
  },
});

export const list = query({
  args: {
    muscleGroup: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.muscleGroup) {
      return await ctx.db
        .query("exercises")
        .withIndex("by_muscle_group", (q) =>
          q.eq("muscleGroup", args.muscleGroup as never)
        )
        .collect();
    }
    if (args.category) {
      return await ctx.db
        .query("exercises")
        .withIndex("by_category", (q) =>
          q.eq("category", args.category as never)
        )
        .collect();
    }
    return await ctx.db.query("exercises").collect();
  },
});

export const get = query({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getHistory = query({
  args: {
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sets = await ctx.db
      .query("sets")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", args.userId).eq("exerciseId", args.exerciseId)
      )
      .order("desc")
      .take(200);

    // Group by workout
    const workoutMap = new Map<
      string,
      { workoutId: string; date: number; sets: typeof sets }
    >();

    for (const set of sets) {
      const wid = set.workoutId;
      if (!workoutMap.has(wid)) {
        const workout = await ctx.db.get(set.workoutId);
        if (workout) {
          workoutMap.set(wid, { workoutId: wid, date: workout.date, sets: [] });
        }
      }
      workoutMap.get(wid)?.sets.push(set);
    }

    const sessions = Array.from(workoutMap.values()).sort(
      (a, b) => b.date - a.date
    );
    return sessions.slice(0, args.limit ?? 20);
  },
});

export const createCustom = mutation({
  args: {
    name: v.string(),
    muscleGroup: v.union(
      v.literal("chest"),
      v.literal("back"),
      v.literal("shoulders"),
      v.literal("biceps"),
      v.literal("triceps"),
      v.literal("quads"),
      v.literal("hamstrings"),
      v.literal("glutes"),
      v.literal("calves"),
      v.literal("core"),
      v.literal("full_body"),
      v.literal("cardio")
    ),
    category: v.union(
      v.literal("push"),
      v.literal("pull"),
      v.literal("legs"),
      v.literal("other")
    ),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("exercises", {
      name: args.name,
      muscleGroup: args.muscleGroup,
      category: args.category,
      isCustom: true,
      createdBy: args.userId,
    });
  },
});
