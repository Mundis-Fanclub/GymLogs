import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserMatch } from "./authz";

export const get = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserMatch(ctx, args.userId);
    return await ctx.db
      .query("rest_preferences")
      .withIndex("by_user_and_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", args.exerciseId)
      )
      .first();
  },
});

export const set = mutation({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
    restSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserMatch(ctx, args.userId);
    const existing = await ctx.db
      .query("rest_preferences")
      .withIndex("by_user_and_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", args.exerciseId)
      )
      .first();

    const restSeconds = Math.max(30, Math.min(900, args.restSeconds));
    if (existing) {
      await ctx.db.patch(existing._id, {
        restSeconds,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("rest_preferences", {
      userId,
      exerciseId: args.exerciseId,
      restSeconds,
      updatedAt: Date.now(),
    });
  },
});
