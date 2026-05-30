import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const muscleGroups = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "legs",
  "other",
  "full_body",
  "cardio",
] as const;

export const categories = ["push", "pull", "legs", "other"] as const;

export const leaderboardLiftTypes = [
  "bench_press",
  "squat",
  "deadlift",
] as const;

export const verificationStatuses = [
  "draft",
  "submitted",
  "pending_review",
  "verified",
  "rejected",
] as const;

export const equipmentClasses = ["raw", "wraps", "single_ply", "multi_ply"] as const;
export const sexClasses = ["female", "male", "open"] as const;

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    searchText: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    coverUrl: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    location: v.optional(v.string()),
    favoriteLift: v.optional(v.string()),
    trainingGoal: v.optional(v.string()),
    profileAccent: v.optional(v.string()),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    birthDate: v.optional(v.string()),
    isPro: v.optional(v.boolean()),
    proSince: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    allowMessages: v.optional(v.boolean()),
    showTrainingSummary: v.optional(v.boolean()),
    publicFields: v.optional(
      v.object({
        bio: v.optional(v.boolean()),
        location: v.optional(v.boolean()),
        favoriteLift: v.optional(v.boolean()),
        trainingGoal: v.optional(v.boolean()),
        heightCm: v.boolean(),
        weightKg: v.boolean(),
        birthDate: v.boolean(),
        trainingSummary: v.optional(v.boolean()),
        trainingStreak: v.optional(v.boolean()),
        trainingBestSet: v.optional(v.boolean()),
        trainingActivity: v.optional(v.boolean()),
        trainingVolume: v.optional(v.boolean()),
      })
    ),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_is_public", ["isPublic"])
    .searchIndex("search_profile", {
      searchField: "searchText",
      filterFields: ["isPublic"],
    }),

  username_reservations: defineTable({
    username: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_user", ["userId"]),

  friends: defineTable({
    requesterId: v.id("users"),
    addresseeId: v.id("users"),
    status: v.union(v.literal("accepted"), v.literal("blocked")),
    createdAt: v.number(),
  })
    .index("by_requester", ["requesterId", "createdAt"])
    .index("by_addressee", ["addresseeId", "createdAt"])
    .index("by_pair", ["requesterId", "addresseeId"]),

  exercises: defineTable({
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
      v.literal("legs"),
      v.literal("other"),
      v.literal("full_body"),
      v.literal("cardio")
    ),
    category: v.union(
      v.literal("push"),
      v.literal("pull"),
      v.literal("legs"),
      v.literal("other")
    ),
    isCustom: v.boolean(),
    isLeaderboardLift: v.optional(v.boolean()),
    leaderboardLiftType: v.optional(
      v.union(
        v.literal("bench_press"),
        v.literal("squat"),
        v.literal("deadlift")
      )
    ),
    bodygraphZones: v.optional(
      v.array(
        v.union(
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
          v.literal("legs")
        )
      )
    ),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_muscle_group", ["muscleGroup"])
    .index("by_category", ["category"])
    .index("by_leaderboard_lift", ["isLeaderboardLift"])
    .searchIndex("search_by_name", { searchField: "name" }),

  workouts: defineTable({
    userId: v.id("users"),
    date: v.number(),
    notes: v.optional(v.string()),
    isCompleted: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  workout_templates: defineTable({
    userId: v.id("users"),
    name: v.string(),
    sourceWorkoutId: v.optional(v.id("workouts")),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("friends"), v.literal("public"))
    ),
    showWeights: v.optional(v.boolean()),
    description: v.optional(v.string()),
    exercises: v.array(
      v.object({
        exerciseId: v.id("exercises"),
        exerciseName: v.string(),
        muscleGroup: v.string(),
        category: v.string(),
        sets: v.array(
          v.object({
            weight: v.number(),
            reps: v.number(),
          })
        ),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  sets: defineTable({
    workoutId: v.id("workouts"),
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
    weight: v.number(),
    reps: v.number(),
    rir: v.optional(v.number()),
    notes: v.optional(v.string()),
    restSeconds: v.optional(v.number()),
    setOrder: v.number(),
    createdAt: v.number(),
  })
    .index("by_workout", ["workoutId"])
    .index("by_user_exercise", ["userId", "exerciseId"])
    .index("by_user_created", ["userId", "createdAt"]),

  rest_preferences: defineTable({
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
    restSeconds: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_exercise", ["userId", "exerciseId"]),

  conversations: defineTable({
    userAId: v.id("users"),
    userBId: v.id("users"),
    lastMessagePreview: v.optional(v.string()),
    lastSenderId: v.optional(v.id("users")),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_a_and_updated", ["userAId", "updatedAt"])
    .index("by_user_b_and_updated", ["userBId", "updatedAt"])
    .index("by_pair", ["userAId", "userBId"]),

  messages: defineTable({
    conversationId: v.optional(v.id("conversations")),
    senderId: v.id("users"),
    recipientId: v.id("users"),
    body: v.string(),
    type: v.optional(v.union(v.literal("text"), v.literal("post_share"), v.literal("image"))),
    postId: v.optional(v.id("social_posts")),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.literal("image")),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
    reportCount: v.optional(v.number()),
    hiddenForSender: v.optional(v.boolean()),
    hiddenForRecipient: v.optional(v.boolean()),
  })
    .index("by_sender", ["senderId", "createdAt"])
    .index("by_recipient", ["recipientId", "createdAt"])
    .index("by_conversation", ["senderId", "recipientId", "createdAt"])
    .index("by_conversation_id", ["conversationId", "createdAt"]),

  message_blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_blocker", ["blockerId", "createdAt"])
    .index("by_blocker_and_blocked", ["blockerId", "blockedId"]),

  message_reports: defineTable({
    reporterId: v.id("users"),
    reportedUserId: v.id("users"),
    messageId: v.optional(v.id("messages")),
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("reviewed"), v.literal("dismissed")),
    createdAt: v.number(),
  })
    .index("by_reporter", ["reporterId", "createdAt"])
    .index("by_reported_user", ["reportedUserId", "createdAt"])
    .index("by_status", ["status", "createdAt"]),

  social_posts: defineTable({
    authorId: v.id("users"),
    body: v.string(),
    bodyAfter: v.optional(v.string()),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("gif"))),
    mediaSize: v.optional(v.union(v.literal("sm"), v.literal("md"), v.literal("lg"))),
    mediaScale: v.optional(v.number()),
    linkedSubmissionId: v.optional(v.id("log_submissions")),
    repostOfPostId: v.optional(v.id("social_posts")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_created", ["createdAt"])
    .index("by_author", ["authorId", "createdAt"])
    .index("by_repost", ["repostOfPostId", "createdAt"]),

  social_comments: defineTable({
    postId: v.id("social_posts"),
    parentCommentId: v.optional(v.id("social_comments")),
    authorId: v.id("users"),
    body: v.string(),
    mediaStorageId: v.optional(v.id("_storage")),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("gif"))),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_post", ["postId", "createdAt"])
    .index("by_post_and_parent_comment", ["postId", "parentCommentId", "createdAt"])
    .index("by_author", ["authorId", "createdAt"]),

  social_likes: defineTable({
    postId: v.id("social_posts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_post", ["postId", "createdAt"])
    .index("by_user", ["userId", "createdAt"])
    .index("by_post_and_user", ["postId", "userId"]),

  social_saves: defineTable({
    postId: v.id("social_posts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_post", ["postId", "createdAt"])
    .index("by_user", ["userId", "createdAt"])
    .index("by_post_and_user", ["postId", "userId"]),

  social_comment_likes: defineTable({
    commentId: v.id("social_comments"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_comment", ["commentId", "createdAt"])
    .index("by_user", ["userId", "createdAt"])
    .index("by_comment_and_user", ["commentId", "userId"]),

  log_brackets: defineTable({
    liftType: v.union(
      v.literal("bench_press"),
      v.literal("squat"),
      v.literal("deadlift")
    ),
    sex: v.union(v.literal("female"), v.literal("male"), v.literal("open")),
    equipment: v.union(
      v.literal("raw"),
      v.literal("wraps"),
      v.literal("single_ply"),
      v.literal("multi_ply")
    ),
    bodyweightClass: v.string(),
    minBodyweightKg: v.optional(v.number()),
    maxBodyweightKg: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_lift", ["liftType"])
    .index("by_bracket", ["liftType", "sex", "equipment", "bodyweightClass"]),

  log_submissions: defineTable({
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
    workoutId: v.optional(v.id("workouts")),
    setId: v.optional(v.id("sets")),
    liftType: v.union(
      v.literal("bench_press"),
      v.literal("squat"),
      v.literal("deadlift")
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("pending_review"),
      v.literal("verified"),
      v.literal("rejected")
    ),
    weightKg: v.number(),
    reps: v.number(),
    bodyweightKg: v.optional(v.number()),
    bodyweightClass: v.string(),
    sex: v.union(v.literal("female"), v.literal("male"), v.literal("open")),
    equipment: v.union(
      v.literal("raw"),
      v.literal("wraps"),
      v.literal("single_ply"),
      v.literal("multi_ply")
    ),
    videoStorageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    videoDurationSeconds: v.optional(v.number()),
    videoMimeType: v.optional(v.string()),
    bracketKey: v.string(),
    score: v.optional(v.number()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewerId: v.optional(v.id("users")),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_lift_status", ["liftType", "status"])
    .index("by_leaderboard", [
      "liftType",
      "sex",
      "equipment",
      "bodyweightClass",
      "status",
      "score",
    ]),

  log_verification_events: defineTable({
    submissionId: v.id("log_submissions"),
    fromStatus: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("submitted"),
        v.literal("pending_review"),
        v.literal("verified"),
        v.literal("rejected")
      )
    ),
    toStatus: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("pending_review"),
      v.literal("verified"),
      v.literal("rejected")
    ),
    reviewerId: v.optional(v.id("users")),
    note: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_submission", ["submissionId"]),

  leaderboard_snapshots: defineTable({
    liftType: v.union(
      v.literal("bench_press"),
      v.literal("squat"),
      v.literal("deadlift")
    ),
    bracketKey: v.string(),
    generatedAt: v.number(),
    entries: v.array(
      v.object({
        rank: v.number(),
        submissionId: v.id("log_submissions"),
        userId: v.id("users"),
        score: v.number(),
        weightKg: v.number(),
        reps: v.number(),
      })
    ),
  })
    .index("by_lift", ["liftType"])
    .index("by_bracket", ["liftType", "bracketKey", "generatedAt"]),
});
