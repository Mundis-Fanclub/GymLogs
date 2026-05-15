import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const liftType = v.union(
  v.literal("bench_press"),
  v.literal("squat"),
  v.literal("deadlift")
);

const verificationStatus = v.union(
  v.literal("draft"),
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

export const createSubmission = mutation({
  args: {
    userId: v.id("users"),
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
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise?.isLeaderboardLift || exercise.leaderboardLiftType !== args.liftType) {
      throw new Error("Only Bench Press, Squat, and Deadlift can be submitted to leaderboards.");
    }

    const key = bracketKey(args);
    const submissionId = await ctx.db.insert("log_submissions", {
      ...args,
      status: "submitted",
      bracketKey: key,
      score: estimateScore(args.weightKg, args.reps),
      submittedAt: Date.now(),
    });

    await ctx.db.insert("log_verification_events", {
      submissionId,
      toStatus: "submitted",
      note: "Submission created",
      createdAt: Date.now(),
    });

    return submissionId;
  },
});

export const updateVerificationStatus = mutation({
  args: {
    submissionId: v.id("log_submissions"),
    status: verificationStatus,
    reviewerId: v.optional(v.id("users")),
    note: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found.");

    await ctx.db.patch(args.submissionId, {
      status: args.status,
      reviewerId: args.reviewerId,
      reviewedAt:
        args.status === "verified" || args.status === "rejected"
          ? Date.now()
          : submission.reviewedAt,
      rejectionReason: args.rejectionReason,
    });

    await ctx.db.insert("log_verification_events", {
      submissionId: args.submissionId,
      fromStatus: submission.status,
      toStatus: args.status,
      reviewerId: args.reviewerId,
      note: args.note,
      createdAt: Date.now(),
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
    const submissions = await ctx.db
      .query("log_submissions")
      .withIndex("by_lift_status", (q) =>
        q.eq("liftType", args.liftType).eq("status", "verified")
      )
      .collect();

    const filtered = submissions
      .filter((submission) => !args.sex || submission.sex === args.sex)
      .filter((submission) => !args.equipment || submission.equipment === args.equipment)
      .filter(
        (submission) =>
          !args.bodyweightClass ||
          submission.bodyweightClass === args.bodyweightClass
      )
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, args.limit ?? 25);

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
    return await ctx.db
      .query("log_submissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getProfileTopLogs = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];
    if (user.isPublic === false && args.viewerId !== args.userId) return [];

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
