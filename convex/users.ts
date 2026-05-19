import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

async function profileMedia(ctx: QueryCtx, user: Doc<"users">) {
  const [avatarStorageUrl, coverStorageUrl] = await Promise.all([
    user.avatarStorageId ? ctx.storage.getUrl(user.avatarStorageId) : null,
    user.coverStorageId ? ctx.storage.getUrl(user.coverStorageId) : null,
  ]);

  return {
    avatarUrl: avatarStorageUrl ?? user.avatarUrl,
    coverUrl: coverStorageUrl ?? user.coverUrl,
  };
}

async function reserveUsername(
  ctx: MutationCtx,
  username: string,
  userId: Doc<"users">["_id"]
) {
  const reservation = await ctx.db
    .query("username_reservations")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();

  if (reservation && reservation.userId !== userId) {
    throw new Error("Username is already taken.");
  }

  if (!reservation) {
    await ctx.db.insert("username_reservations", {
      username,
      userId,
      createdAt: Date.now(),
    });
  }
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
        showTrainingSummary?: boolean;
        profileAccent?: string;
        publicFields?: {
          heightCm: boolean;
          weightKg: boolean;
          birthDate: boolean;
          trainingSummary?: boolean;
        };
      } = {};

      if (!existing.name && args.name) updates.name = args.name;
      if (!existing.email && args.email) updates.email = args.email;
      if (!existing.username) {
        const fallback = normalizeUsername(args.name || args.email.split("@")[0] || "user");
        updates.username = fallback ? `${fallback}_${existing._id.slice(-4)}` : `user_${existing._id.slice(-4)}`;
      }
      if (existing.isPublic === undefined) updates.isPublic = true;
      if (existing.allowMessages === undefined) updates.allowMessages = true;
      if (existing.showTrainingSummary === undefined) updates.showTrainingSummary = true;
      if (!existing.profileAccent) updates.profileAccent = "emerald";
      if (!existing.publicFields) {
        updates.publicFields = {
          heightCm: false,
          weightKg: false,
          birthDate: false,
          trainingSummary: true,
        };
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existing._id, updates);
      }
      if (existing.username) {
        await reserveUsername(ctx, existing.username, existing._id);
      }

      return existing._id;
    }

    const inserted = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      isPublic: true,
      allowMessages: true,
      showTrainingSummary: true,
      profileAccent: "emerald",
      publicFields: {
        heightCm: false,
        weightKg: false,
        birthDate: false,
        trainingSummary: true,
      },
    });

    const fallback = normalizeUsername(args.name || args.email.split("@")[0] || "user");
    const username = fallback ? `${fallback}_${inserted.slice(-4)}` : `user_${inserted.slice(-4)}`;
    await reserveUsername(ctx, username, inserted);
    await ctx.db.patch(inserted, { username });

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
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const media = await profileMedia(ctx, user);
    return { ...user, ...media };
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
        isPro: user.isPro ?? false,
        isPublic: false,
        allowMessages: false,
      };
    }

    const publicFields = user.publicFields ?? {
      heightCm: false,
      weightKg: false,
      birthDate: false,
      trainingSummary: true,
    };
    const canSeeTrainingSummary =
      isSelf ||
      (user.showTrainingSummary !== false &&
        publicFields.trainingSummary !== false &&
        user.isPublic !== false);

    let trainingSummary = null;
    if (canSeeTrainingSummary) {
      const workouts = await ctx.db
        .query("workouts")
        .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(120);

      const completedWorkouts = workouts.filter((workout) => workout.isCompleted);
      const sets = await ctx.db
        .query("sets")
        .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(600);

      const exerciseIds = new Set<string>();
      let totalVolume = 0;
      let bestSet = null as null | {
        exerciseName: string;
        weight: number;
        reps: number;
        volume: number;
      };

      for (const set of sets) {
        exerciseIds.add(set.exerciseId);
        const volume = set.weight * set.reps;
        totalVolume += volume;
        if (!bestSet || volume > bestSet.volume) {
          const exercise = await ctx.db.get(set.exerciseId);
          bestSet = {
            exerciseName: exercise?.name ?? "Exercise",
            weight: set.weight,
            reps: set.reps,
            volume,
          };
        }
      }

      const lastWorkout = completedWorkouts[0];
      const firstWorkout = completedWorkouts[completedWorkouts.length - 1];
      const activeWeeks =
        firstWorkout && lastWorkout
          ? Math.max(
              1,
              Math.ceil(
                (lastWorkout.date - firstWorkout.date) / (7 * 24 * 60 * 60 * 1000)
              ) + 1
            )
          : 0;

      trainingSummary = {
        completedWorkouts: completedWorkouts.length,
        totalSets: sets.length,
        totalVolume,
        uniqueExercises: exerciseIds.size,
        activeWeeks,
        lastWorkoutAt: lastWorkout?.date,
        averageWorkoutsPerWeek:
          activeWeeks > 0
            ? Math.round((completedWorkouts.length / activeWeeks) * 10) / 10
            : 0,
        bestSet,
      };
    }

    const media = await profileMedia(ctx, user);

    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatarUrl: media.avatarUrl,
      coverUrl: media.coverUrl,
      avatarStorageId: user.avatarStorageId,
      coverStorageId: user.coverStorageId,
      location: user.location,
      favoriteLift: user.favoriteLift,
      trainingGoal: user.trainingGoal,
      profileAccent: user.profileAccent ?? "emerald",
      isPro: user.isPro ?? false,
      proSince: user.proSince,
      isPublic: user.isPublic ?? true,
      allowMessages: user.allowMessages ?? true,
      showTrainingSummary: user.showTrainingSummary ?? true,
      heightCm: isSelf || publicFields.heightCm ? user.heightCm : undefined,
      weightKg: isSelf || publicFields.weightKg ? user.weightKg : undefined,
      birthDate: isSelf || publicFields.birthDate ? user.birthDate : undefined,
      publicFields,
      trainingSummary,
    };
  },
});

export const searchPublic = query({
  args: { query: v.string(), viewerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const normalized = args.query.trim().toLowerCase();
    if (normalized.length < 2) return [];

    const users = await ctx.db.query("users").take(100);
    const results = users
      .filter((user) => user.isPublic !== false)
      .filter((user) => user._id !== args.viewerId)
      .filter((user) => {
        const username = user.username?.toLowerCase() ?? "";
        const name = user.name.toLowerCase();
        return username.includes(normalized) || name.includes(normalized);
      })
      .slice(0, 12);

    return await Promise.all(
      results.map(async (user) => {
        const media = await profileMedia(ctx, user);
        return {
        _id: user._id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatarUrl: media.avatarUrl,
        profileAccent: user.profileAccent ?? "emerald",
        isPro: user.isPro ?? false,
        allowMessages: user.allowMessages ?? true,
        };
      })
    );
  },
});

export const generateProfileUploadUrl = mutation({
  args: {
    userId: v.id("users"),
    kind: v.union(v.literal("avatar"), v.literal("cover")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    username: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    location: v.optional(v.string()),
    favoriteLift: v.optional(v.string()),
    trainingGoal: v.optional(v.string()),
    profileAccent: v.string(),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    birthDate: v.optional(v.string()),
    isPublic: v.boolean(),
    allowMessages: v.boolean(),
    showTrainingSummary: v.boolean(),
    publicFields: v.object({
      heightCm: v.boolean(),
      weightKg: v.boolean(),
      birthDate: v.boolean(),
      trainingSummary: v.boolean(),
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

    const currentUser = await ctx.db.get(args.userId);
    if (!currentUser) throw new Error("User not found.");
    await reserveUsername(ctx, username, args.userId);
    const oldUsername = currentUser.username;
    if (oldUsername && oldUsername !== username) {
      const oldReservation = await ctx.db
        .query("username_reservations")
        .withIndex("by_username", (q) => q.eq("username", oldUsername))
        .first();
      if (oldReservation?.userId === args.userId) {
        await ctx.db.delete(oldReservation._id);
      }
    }

    await ctx.db.patch(args.userId, {
      name: args.name.trim() || "GymLogs User",
      username,
      bio: args.bio?.trim().slice(0, 180),
      avatarUrl: args.avatarUrl?.trim().slice(0, 500),
      avatarStorageId: args.avatarStorageId,
      coverUrl: args.coverUrl?.trim().slice(0, 500),
      coverStorageId: args.coverStorageId,
      location: args.location?.trim().slice(0, 80),
      favoriteLift: args.favoriteLift?.trim().slice(0, 60),
      trainingGoal: args.trainingGoal?.trim().slice(0, 120),
      profileAccent: ["emerald", "sky", "rose", "amber", "violet"].includes(args.profileAccent)
        ? args.profileAccent
        : "emerald",
      heightCm: args.heightCm,
      weightKg: args.weightKg,
      birthDate: args.birthDate,
      isPublic: args.isPublic,
      allowMessages: args.allowMessages,
      showTrainingSummary: args.showTrainingSummary,
      publicFields: args.publicFields,
      updatedAt: Date.now(),
    });
  },
});
