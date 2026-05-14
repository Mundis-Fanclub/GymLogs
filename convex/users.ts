import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export const getOrCreate = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      const updates: {
        name?: string;
        email?: string;
        username?: string;
        isPublic?: boolean;
        allowMessages?: boolean;
        publicFields?: { heightCm: boolean; weightKg: boolean; birthDate: boolean };
      } = {};

      if (!existing.name && args.name) updates.name = args.name;
      if (!existing.email && args.email) updates.email = args.email;
      if (!existing.username) {
        const fallback = normalizeUsername(args.name || args.email.split("@")[0] || "user");
        updates.username = fallback ? `${fallback}_${existing._id.slice(-4)}` : `user_${existing._id.slice(-4)}`;
      }
      if (existing.isPublic === undefined) updates.isPublic = true;
      if (existing.allowMessages === undefined) updates.allowMessages = true;
      if (!existing.publicFields) {
        updates.publicFields = { heightCm: false, weightKg: false, birthDate: false };
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, updates);
      }

      return existing._id;
    }

    const inserted = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      isPublic: true,
      allowMessages: true,
      publicFields: { heightCm: false, weightKg: false, birthDate: false },
    });

    const fallback = normalizeUsername(args.name || args.email.split("@")[0] || "user");
    await ctx.db.patch(inserted, {
      username: fallback ? `${fallback}_${inserted.slice(-4)}` : `user_${inserted.slice(-4)}`,
    });

    return inserted;
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getPublicProfile = query({
  args: { userId: v.id("users"), viewerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const isSelf = args.viewerId === args.userId;
    if (!isSelf && user.isPublic === false) {
      return {
        _id: user._id,
        name: user.name,
        username: user.username,
        isPublic: false,
        allowMessages: false,
      };
    }

    const publicFields = user.publicFields ?? {
      heightCm: false,
      weightKg: false,
      birthDate: false,
    };

    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      isPublic: user.isPublic ?? true,
      allowMessages: user.allowMessages ?? true,
      heightCm: isSelf || publicFields.heightCm ? user.heightCm : undefined,
      weightKg: isSelf || publicFields.weightKg ? user.weightKg : undefined,
      birthDate: isSelf || publicFields.birthDate ? user.birthDate : undefined,
      publicFields,
    };
  },
});

export const searchPublic = query({
  args: { query: v.string(), viewerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const normalized = args.query.trim().toLowerCase();
    if (normalized.length < 2) return [];

    const users = await ctx.db.query("users").take(100);
    return users
      .filter((user) => user.isPublic !== false)
      .filter((user) => user._id !== args.viewerId)
      .filter((user) => {
        const username = user.username?.toLowerCase() ?? "";
        const name = user.name.toLowerCase();
        return username.includes(normalized) || name.includes(normalized);
      })
      .slice(0, 12)
      .map((user) => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        allowMessages: user.allowMessages ?? true,
      }));
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    username: v.string(),
    bio: v.optional(v.string()),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    birthDate: v.optional(v.string()),
    isPublic: v.boolean(),
    allowMessages: v.boolean(),
    publicFields: v.object({
      heightCm: v.boolean(),
      weightKg: v.boolean(),
      birthDate: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const username = normalizeUsername(args.username);
    if (username.length < 3) {
      throw new Error("Username must contain at least 3 letters or numbers.");
    }

    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (existingUsername && existingUsername._id !== args.userId) {
      throw new Error("Username is already taken.");
    }

    await ctx.db.patch(args.userId, {
      name: args.name.trim() || "GymLogs User",
      username,
      bio: args.bio?.trim().slice(0, 180),
      heightCm: args.heightCm,
      weightKg: args.weightKg,
      birthDate: args.birthDate,
      isPublic: args.isPublic,
      allowMessages: args.allowMessages,
      publicFields: args.publicFields,
      updatedAt: Date.now(),
    });
  },
});
