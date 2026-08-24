import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  requireAuthenticatedUserId,
  requireFinitePositiveNumber,
  requireModerator,
  requirePositiveInteger,
  requireUserMatch,
  sanitizeText,
} from "./authz";

const liftType = v.union(
  v.literal("bench_press"),
  v.literal("squat"),
  v.literal("deadlift")
);

const verificationStatus = v.union(
  v.literal("draft"),
  v.literal("awaiting_upload"),
  v.literal("uploaded"),
  v.literal("queued"),
  v.literal("processing"),
  v.literal("needs_review"),
  v.literal("submitted"),
  v.literal("pending_review"),
  v.literal("verified"),
  v.literal("rejected")
);

const sex = v.union(v.literal("female"), v.literal("male"), v.literal("open"));

const equipment = v.union(
  v.literal("raw"),
  v.literal("wraps"),
  v.literal("single_ply"),
  v.literal("multi_ply")
);

const validationSource = v.union(
  v.literal("manual_review"),
  v.literal("ai_pattern"),
  v.literal("hybrid")
);

function bracketKey(args: {
  liftType: "bench_press" | "squat" | "deadlift";
  sex: "female" | "male" | "open";
  equipment: "raw" | "wraps" | "single_ply" | "multi_ply";
  bodyweightClass: string;
}) {
  return [
    args.liftType,
    args.sex,
    args.equipment,
    args.bodyweightClass.trim().toLowerCase().replaceAll(" ", ""),
  ].join(":");
}

function estimateScore(weightKg: number, reps: number) {
  const oneRepMax = weightKg * (1 + reps / 30);
  return Math.round(oneRepMax * 100) / 100;
}

function requireBodyweightClass(value: string) {
  const bodyweightClass = value.trim().slice(0, 32);
  if (!bodyweightClass) throw new Error("Bodyweight class is required.");
  return bodyweightClass;
}

function requireOptionalPositiveNumber(
  value: number | undefined,
  fieldName: string,
  max: number
) {
  if (value === undefined) return undefined;
  return requireFinitePositiveNumber(value, fieldName, max);
}

async function requireSubmissionOwner(
  ctx: MutationCtx,
  submissionId: Id<"log_submissions">
) {
  const userId = await requireAuthenticatedUserId(ctx);
  const submission = await ctx.db.get(submissionId);
  if (!submission || submission.userId !== userId) {
    throw new Error("Submission not found.");
  }
  return submission;
}

export const generateSubmissionUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createSubmission = mutation({
  args: {
    exerciseId: v.id("exercises"),
    workoutId: v.optional(v.id("workouts")),
    setId: v.optional(v.id("sets")),
    liftType,
    weightKg: v.number(),
    reps: v.number(),
    bodyweightKg: v.optional(v.number()),
    bodyweightClass: v.string(),
    sex,
    equipment,
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    videoDurationSeconds: v.optional(v.number()),
    videoMimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUserId(ctx);
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise?.isLeaderboardLift || exercise.leaderboardLiftType !== args.liftType) {
      throw new Error("Only Bench Press, Squat, and Deadlift can be submitted to leaderboards.");
    }

    const workout = args.workoutId ? await ctx.db.get(args.workoutId) : null;
    if (args.workoutId && (!workout || workout.userId !== userId)) {
      throw new Error("Workout not found.");
    }

    const set = args.setId ? await ctx.db.get(args.setId) : null;
    if (args.setId && (!set || set.userId !== userId)) {
      throw new Error("Set not found.");
    }
    if (set) {
      if (set.exerciseId !== args.exerciseId) {
        throw new Error("Submission exercise must match the logged set.");
      }
      if (workout && set.workoutId !== workout._id) {
        throw new Error("Submission set must belong to the selected workout.");
      }
      if (
        Math.abs(set.weight - args.weightKg) > 0.01 ||
        set.reps !== args.reps
      ) {
        throw new Error("Submission values must match the logged set.");
      }
    }

    const weightKg = requireFinitePositiveNumber(args.weightKg, "Weight", 1000);
    const reps = requirePositiveInteger(args.reps, "Reps", 200);
    const bodyweightKg = requireOptionalPositiveNumber(
      args.bodyweightKg,
      "Bodyweight",
      400
    );
    const bodyweightClass = requireBodyweightClass(args.bodyweightClass);
    const key = bracketKey({ ...args, bodyweightClass });
    const status = args.videoStorageId || args.videoUrl ? "uploaded" : "awaiting_upload";
    const now = Date.now();
    const submissionId = await ctx.db.insert("log_submissions", {
      userId,
      exerciseId: args.exerciseId,
      workoutId: args.workoutId,
      setId: args.setId,
      liftType: args.liftType,
      status,
      weightKg,
      reps,
      bodyweightKg,
      bodyweightClass,
      sex: args.sex,
      equipment: args.equipment,
      videoStorageId: args.videoStorageId,
      videoUrl: sanitizeText(args.videoUrl, 500),
      videoDurationSeconds: requireOptionalPositiveNumber(
        args.videoDurationSeconds,
        "Video duration",
        60 * 30
      ),
      videoMimeType: sanitizeText(args.videoMimeType, 80),
      bracketKey: key,
      score: estimateScore(weightKg, reps),
      submittedAt: now,
    });

    await ctx.db.insert("log_verification_events", {
      submissionId,
      toStatus: status,
      note: "Submission created",
      createdAt: now,
    });

    return submissionId;
  },
});

export const attachSubmissionVideo = mutation({
  args: {
    submissionId: v.id("log_submissions"),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    videoDurationSeconds: v.optional(v.number()),
    videoMimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submission = await requireSubmissionOwner(ctx, args.submissionId);
    if (submission.status === "verified" || submission.status === "rejected") {
      throw new Error("Finalized submissions cannot be changed.");
    }
    if (!args.videoStorageId && !args.videoUrl) {
      throw new Error("A video file is required.");
    }

    const now = Date.now();
    await ctx.db.patch(args.submissionId, {
      status: "uploaded",
      videoStorageId: args.videoStorageId,
      videoUrl: sanitizeText(args.videoUrl, 500),
      videoDurationSeconds: requireOptionalPositiveNumber(
        args.videoDurationSeconds,
        "Video duration",
        60 * 30
      ),
      videoMimeType: sanitizeText(args.videoMimeType, 80),
    });

    await ctx.db.insert("log_verification_events", {
      submissionId: args.submissionId,
      fromStatus: submission.status,
      toStatus: "uploaded",
      note: "Video attached",
      createdAt: now,
    });
  },
});

export const updateVerificationStatus = mutation({
  args: {
    submissionId: v.id("log_submissions"),
    status: verificationStatus,
    validationSource: v.optional(validationSource),
    validationScore: v.optional(v.number()),
    validationNotes: v.optional(v.string()),
    note: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reviewer = await requireModerator(ctx);
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found.");

    const now = Date.now();
    const validationScore =
      args.validationScore === undefined
        ? undefined
        : Math.max(0, Math.min(1, args.validationScore));

    await ctx.db.patch(args.submissionId, {
      status: args.status,
      reviewerId: reviewer._id,
      reviewedAt:
        args.status === "verified" || args.status === "rejected"
          ? now
          : submission.reviewedAt,
      rejectionReason: sanitizeText(args.rejectionReason, 500),
      validationSource: args.validationSource,
      validationScore,
      validationNotes: sanitizeText(args.validationNotes, 1000),
      validatedAt: validationScore !== undefined || args.validationSource ? now : submission.validatedAt,
    });

    await ctx.db.insert("log_verification_events", {
      submissionId: args.submissionId,
      fromStatus: submission.status,
      toStatus: args.status,
      reviewerId: reviewer._id,
      note: sanitizeText(args.note, 1000),
      createdAt: now,
    });
  },
});

export const leaderboard = query({
  args: {
    liftType,
    sex: v.optional(sex),
    equipment: v.optional(equipment),
    bodyweightClass: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
    const submissions = await ctx.db
      .query("log_submissions")
      .withIndex("by_lift_status", (q) =>
        q.eq("liftType", args.liftType).eq("status", "verified")
      )
      .take(500);

    const filtered = submissions
      .filter((submission) => !args.sex || submission.sex === args.sex)
      .filter((submission) => !args.equipment || submission.equipment === args.equipment)
      .filter(
        (submission) =>
          !args.bodyweightClass ||
          submission.bodyweightClass === args.bodyweightClass
      )
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);

    return await Promise.all(
      filtered.map(async (submission, index) => {
        const user = await ctx.db.get(submission.userId);
        const exercise = await ctx.db.get(submission.exerciseId);
        return {
          rank: index + 1,
          submission,
          athleteName: user?.name ?? "Unknown",
          exerciseName: exercise?.name ?? args.liftType,
        };
      })
    );
  },
});

export const listMine = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserMatch(ctx, args.userId);
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    return await ctx.db
      .query("log_submissions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getProfileTopLogs = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewerId = args.viewerId
      ? await requireUserMatch(ctx, args.viewerId)
      : undefined;
    const user = await ctx.db.get(args.userId);
    if (!user) return [];
    if (user.isPublic === false && viewerId !== args.userId) return [];

    const submissions = await ctx.db
      .query("log_submissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);

    const verified = submissions
      .filter((submission) => submission.status === "verified")
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, args.limit ?? 5);

    return await Promise.all(
      verified.map(async (submission) => {
        const [exercise, bracketSubmissions] = await Promise.all([
          ctx.db.get(submission.exerciseId),
          ctx.db
            .query("log_submissions")
            .withIndex("by_leaderboard", (q) =>
              q
                .eq("liftType", submission.liftType)
                .eq("sex", submission.sex)
                .eq("equipment", submission.equipment)
                .eq("bodyweightClass", submission.bodyweightClass)
                .eq("status", "verified")
            )
            .order("desc")
            .take(500),
        ]);

        const ranked = bracketSubmissions.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        const rank = ranked.findIndex((entry) => entry._id === submission._id) + 1;
        const total = ranked.length;
        const percentile =
          rank > 0 && total > 0
            ? Math.round((1 - (rank - 1) / total) * 1000) / 10
            : null;
        const topFiveCutoff = Math.max(1, Math.ceil(total * 0.05));

        return {
          submission,
          exerciseName: exercise?.name ?? submission.liftType,
          rank: rank || null,
          total,
          percentile,
          isTopFivePercent: rank > 0 && rank <= topFiveCutoff,
        };
      })
    );
  },
});
