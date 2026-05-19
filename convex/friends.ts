import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

function orderedPair(a: Id<"users">, b: Id<"users">) {
  return a < b ? { requesterId: a, addresseeId: b } : { requesterId: b, addresseeId: a };
}

async function userPreview(ctx: QueryCtx, user: Doc<"users"> | null) {
  if (!user) return null;
  const avatarUrl = user.avatarStorageId ? await ctx.storage.getUrl(user.avatarStorageId) : null;
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatarUrl: avatarUrl ?? user.avatarUrl,
    isPro: user.isPro ?? false,
  };
}

export const addByUsername = mutation({
  args: {
    userId: v.id("users"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const username = normalizeUsername(args.username);
    if (username.length < 3) throw new Error("Username must contain at least 3 letters or numbers.");

    const target = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!target) throw new Error("User not found.");
    if (target._id === args.userId) throw new Error("You cannot add yourself.");

    const pair = orderedPair(args.userId, target._id);
    const existing = await ctx.db
      .query("friends")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", pair.requesterId).eq("addresseeId", pair.addresseeId)
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("friends", {
      ...pair,
      status: "accepted",
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const pair = orderedPair(args.userId, args.friendId);
    const existing = await ctx.db
      .query("friends")
      .withIndex("by_pair", (q) =>
        q.eq("requesterId", pair.requesterId).eq("addresseeId", pair.addresseeId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const [asRequester, asAddressee] = await Promise.all([
      ctx.db
        .query("friends")
        .withIndex("by_requester", (q) => q.eq("requesterId", args.userId))
        .order("desc")
        .take(50),
      ctx.db
        .query("friends")
        .withIndex("by_addressee", (q) => q.eq("addresseeId", args.userId))
        .order("desc")
        .take(50),
    ]);

    const rows = [...asRequester, ...asAddressee]
      .filter((row) => row.status === "accepted")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 80);

    return await Promise.all(
      rows.map(async (row) => {
        const friendId = row.requesterId === args.userId ? row.addresseeId : row.requesterId;
        return {
          friendshipId: row._id,
          friend: await userPreview(ctx, await ctx.db.get(friendId)),
          createdAt: row.createdAt,
        };
      })
    );
  },
});
