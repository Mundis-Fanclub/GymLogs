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
    bio: v.optional(v.string()),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    birthDate: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    allowMessages: v.optional(v.boolean()),
    publicFields: v.optional(
      v.object({
        heightCm: v.boolean(),
        weightKg: v.boolean(),
        birthDate: v.boolean(),
      })
    ),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

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

  messages: defineTable({
    senderId: v.id("users"),
    recipientId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_sender", ["senderId", "createdAt"])
    .index("by_recipient", ["recipientId", "createdAt"])
    .index("by_conversation", ["senderId", "recipientId", "createdAt"]),

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
