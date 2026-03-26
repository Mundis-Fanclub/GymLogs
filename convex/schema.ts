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
  "full_body",
  "cardio",
] as const;

export const categories = ["push", "pull", "legs", "other"] as const;

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

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
    createdBy: v.optional(v.id("users")),
  })
    .index("by_muscle_group", ["muscleGroup"])
    .index("by_category", ["category"])
    .searchIndex("search_by_name", { searchField: "name" }),

  workouts: defineTable({
    userId: v.id("users"),
    date: v.number(),
    notes: v.optional(v.string()),
    isCompleted: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  sets: defineTable({
    workoutId: v.id("workouts"),
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
    weight: v.number(),
    reps: v.number(),
    rir: v.optional(v.number()),
    setOrder: v.number(),
    createdAt: v.number(),
  })
    .index("by_workout", ["workoutId"])
    .index("by_user_exercise", ["userId", "exerciseId"])
    .index("by_user_created", ["userId", "createdAt"]),
});
