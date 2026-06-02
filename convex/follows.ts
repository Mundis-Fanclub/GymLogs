import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

async function userPreview(
  ctx: QueryCtx,
  user: Doc<"users"> | null,
  viewerFollowingIds: Set<Id<"users">>
) {
  if (!user) return null;
  const avatarUrl = user.avatarStorageId ? await ctx.storage.getUrl(user.avatarStorageId) : null;
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatarUrl: avatarUrl ?? user.avatarUrl,
    isPro: user.isPro ?? false,
    viewerFollowing: viewerFollowingIds.has(user._id),
  };
}

async function viewerFollowingIds(ctx: QueryCtx, viewerId?: Id<"users">) {
  if (!viewerId) return new Set<Id<"users">>();
  const rows = await ctx.db
    .query("follows")
    .withIndex("by_follower", (q) => q.eq("followerId", viewerId))
    .take(200);
  return new Set(rows.map((row) => row.followingId));
}

export const follow = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.followerId === args.followingId) {
      throw new Error("You cannot follow yourself.");
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("follows", {
      followerId: args.followerId,
      followingId: args.followingId,
      createdAt: Date.now(),
    });
  },
});

export const unfollow = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const listForProfile = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 80, 120);
    const [followers, following, viewerIds, viewerFollow] = await Promise.all([
      ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", args.userId))
        .order("desc")
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
        .order("desc")
        .collect(),
      viewerFollowingIds(ctx, args.viewerId),
      args.viewerId
        ? ctx.db
            .query("follows")
            .withIndex("by_pair", (q) =>
              q.eq("followerId", args.viewerId!).eq("followingId", args.userId)
            )
            .unique()
        : null,
    ]);

    return {
      followerCount: followers.length,
      followingCount: following.length,
      viewerFollowing: Boolean(viewerFollow),
      followers: (
        await Promise.all(
          followers.slice(0, limit).map(async (row) => ({
            followId: row._id,
            createdAt: row.createdAt,
            user: await userPreview(ctx, await ctx.db.get(row.followerId), viewerIds),
          }))
        )
      ).filter((entry) => entry.user),
      following: (
        await Promise.all(
          following.slice(0, limit).map(async (row) => ({
            followId: row._id,
            createdAt: row.createdAt,
            user: await userPreview(ctx, await ctx.db.get(row.followingId), viewerIds),
          }))
        )
      ).filter((entry) => entry.user),
    };
  },
});
