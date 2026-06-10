import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const templateVisibility = v.union(
  v.literal("private"),
  v.literal("friends"),
  v.literal("public")
);

const templateExerciseValidator = v.object({
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
});

type TemplateExercise = Doc<"workout_templates">["exercises"][number];
type TemplateChange = {
  kind: "added" | "removed" | "changed";
  exerciseName: string;
  beforeName?: string;
  afterName?: string;
  beforeSets?: number;
  afterSets?: number;
};

function estimated1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function sanitizeTemplateExercises(
  exercises: TemplateExercise[]
): TemplateExercise[] {
  return exercises.slice(0, 80).map((exercise) => ({
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName.trim().slice(0, 80),
    muscleGroup: exercise.muscleGroup.trim().slice(0, 40),
    category: exercise.category.trim().slice(0, 40),
    sets: exercise.sets.slice(0, 20).map((set) => ({
      weight: Number.isFinite(set.weight) ? Math.max(0, set.weight) : 0,
      reps: Number.isFinite(set.reps) ? Math.max(0, Math.round(set.reps)) : 0,
    })),
  }));
}

function templateExerciseSignature(exercise: TemplateExercise) {
  return JSON.stringify({
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    muscleGroup: exercise.muscleGroup,
    category: exercise.category,
    sets: exercise.sets.map((set) => ({ weight: set.weight, reps: set.reps })),
  });
}

function templateExercisesEqual(
  before: TemplateExercise[],
  after: TemplateExercise[]
) {
  if (before.length !== after.length) return false;
  return before.every(
    (exercise, index) =>
      templateExerciseSignature(exercise) ===
      templateExerciseSignature(after[index])
  );
}

function templateExerciseKey(exercise: TemplateExercise) {
  return String(exercise.exerciseId);
}

function describeTemplateExerciseChanges(
  before: TemplateExercise[],
  after: TemplateExercise[]
): TemplateChange[] {
  const beforeByKey = new Map(before.map((exercise) => [templateExerciseKey(exercise), exercise]));
  const afterByKey = new Map(after.map((exercise) => [templateExerciseKey(exercise), exercise]));
  const changes: TemplateChange[] = [];

  for (const exercise of after) {
    const previous = beforeByKey.get(templateExerciseKey(exercise));
    if (!previous) {
      changes.push({
        kind: "added",
        exerciseName: exercise.exerciseName,
        afterName: exercise.exerciseName,
        afterSets: exercise.sets.length,
      });
      continue;
    }

    if (templateExerciseSignature(previous) !== templateExerciseSignature(exercise)) {
      changes.push({
        kind: "changed",
        exerciseName: exercise.exerciseName,
        beforeName: previous.exerciseName,
        afterName: exercise.exerciseName,
        beforeSets: previous.sets.length,
        afterSets: exercise.sets.length,
      });
    }
  }

  for (const exercise of before) {
    if (!afterByKey.has(templateExerciseKey(exercise))) {
      changes.push({
        kind: "removed",
        exerciseName: exercise.exerciseName,
        beforeName: exercise.exerciseName,
        beforeSets: exercise.sets.length,
      });
    }
  }

  if (changes.length === 0 && !templateExercisesEqual(before, after)) {
    changes.push({
      kind: "changed",
      exerciseName: "Exercise order",
      beforeSets: before.length,
      afterSets: after.length,
    });
  }

  return changes.slice(0, 24);
}

function toBodyPart(muscleGroup: string): string {
  if (
    muscleGroup === "quads" ||
    muscleGroup === "hamstrings" ||
    muscleGroup === "glutes" ||
    muscleGroup === "calves"
  ) {
    return "legs";
  }
  if (muscleGroup === "full_body" || muscleGroup === "cardio") {
    return "other";
  }
  if (
    muscleGroup === "chest" ||
    muscleGroup === "back" ||
    muscleGroup === "biceps" ||
    muscleGroup === "triceps" ||
    muscleGroup === "core" ||
    muscleGroup === "legs" ||
    muscleGroup === "shoulders"
  ) {
    return muscleGroup;
  }
  return "other";
}

export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .take(args.limit ?? 20);

    return await Promise.all(
      workouts.map(async (workout) => {
        const sets = await ctx.db
          .query("sets")
          .withIndex("by_workout", (q) => q.eq("workoutId", workout._id))
          .collect();

        const muscleGroups = new Set<string>();
        for (const set of sets) {
          const exercise = await ctx.db.get(set.exerciseId);
          if (exercise) muscleGroups.add(toBodyPart(exercise.muscleGroup));
        }

        return {
          ...workout,
          totalVolume: sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
          totalSets: sets.length,
          muscleGroups: Array.from(muscleGroups),
        };
      })
    );
  },
});

export const getRecent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workouts")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .take(args.limit ?? 5);
  },
});

export const get = query({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) return null;

    const sets = await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    // Group sets by exercise
    const exerciseMap = new Map<
      Id<"exercises">,
      {
        exerciseId: Id<"exercises">;
        exercise: {
          name: string;
          muscleGroup: string;
          category: string;
          bodygraphZones?: string[];
        } | null;
        sets: Array<
          typeof sets[number] & {
            previous?: { weight: number; reps: number };
            isPr: boolean;
          }
        >;
      }
    >();

    for (const set of sets) {
      const eid = set.exerciseId;
      if (!exerciseMap.has(eid)) {
        const exercise = await ctx.db.get(set.exerciseId);
        exerciseMap.set(eid, {
          exerciseId: eid,
          exercise: exercise
            ? {
                name: exercise.name,
                muscleGroup: exercise.muscleGroup,
                category: exercise.category,
                bodygraphZones: exercise.bodygraphZones,
              }
            : null,
          sets: [],
        });
      }
      const previousSets = await ctx.db
        .query("sets")
        .withIndex("by_user_exercise", (q) =>
          q.eq("userId", set.userId).eq("exerciseId", set.exerciseId)
        )
        .order("desc")
        .take(100);

      const previous = previousSets.find(
        (previousSet) =>
          previousSet.workoutId !== args.workoutId &&
          previousSet.setOrder === set.setOrder
      );
      const isPr =
        !previous ||
        set.weight * set.reps > previous.weight * previous.reps ||
        estimated1RM(set.weight, set.reps) >
          estimated1RM(previous.weight, previous.reps);

      exerciseMap.get(eid)?.sets.push({
        ...set,
        previous: previous
          ? { weight: previous.weight, reps: previous.reps }
          : undefined,
        isPr,
      });
    }

    const exercises = Array.from(exerciseMap.values());
    // Sort sets by setOrder within each exercise
    for (const ex of exercises) {
      ex.sets.sort((a, b) => a.setOrder - b.setOrder);
    }

    const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

    return { ...workout, exercises, totalVolume };
  },
});

export const getIncomplete = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isCompleted"), false))
      .first();
  },
});

export const create = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workouts", {
      userId: args.userId,
      date: Date.now(),
      isCompleted: false,
    });
  },
});

export const resetEmptyStart = mutation({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.isCompleted) return null;

    const existingSet = await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .first();

    if (existingSet) return workout._id;

    await ctx.db.patch(args.workoutId, { date: Date.now() });
    return workout._id;
  },
});

export const complete = mutation({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) return;
    if (!workout.isCompleted && workout.sourceTemplateId) {
      const template = await ctx.db.get(workout.sourceTemplateId);
      if (template) {
        await ctx.db.patch(template._id, {
          executionCount: (template.executionCount ?? 0) + 1,
        });
      }
    }
    await ctx.db.patch(args.workoutId, { isCompleted: true, date: Date.now() });
  },
});

export const saveAsTemplate = mutation({
  args: {
    workoutId: v.id("workouts"),
    name: v.string(),
    visibility: v.optional(templateVisibility),
    showWeights: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) throw new Error("Workout not found.");
    if (!workout.isCompleted) {
      throw new Error("Only completed workouts can be saved as templates.");
    }

    const sets = await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    const exerciseMap = new Map<
      string,
      {
        exerciseId: typeof sets[number]["exerciseId"];
        exerciseName: string;
        muscleGroup: string;
        category: string;
        sets: { weight: number; reps: number }[];
      }
    >();

    for (const set of sets) {
      const exercise = await ctx.db.get(set.exerciseId);
      if (!exercise) continue;

      const key = set.exerciseId;
      if (!exerciseMap.has(key)) {
        exerciseMap.set(key, {
          exerciseId: set.exerciseId,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
          category: exercise.category,
          sets: [],
        });
      }

      exerciseMap.get(key)?.sets.push({
        weight: set.weight,
        reps: set.reps,
      });
    }

    const sourceTemplate = workout.sourceTemplateId
      ? await ctx.db.get(workout.sourceTemplateId)
      : null;
    const now = Date.now();

    return await ctx.db.insert("workout_templates", {
      userId: workout.userId,
      name: args.name.trim().slice(0, 80),
      sourceWorkoutId: args.workoutId,
      visibility: args.visibility ?? "private",
      showWeights: args.showWeights ?? false,
      description: args.description?.trim().slice(0, 180),
      exercises: Array.from(exerciseMap.values()),
      version: 1,
      updatedAt: now,
      ...(sourceTemplate
        ? {
            sourceTemplateId: sourceTemplate._id,
            sourceTemplateVersion: sourceTemplate.version ?? 1,
          }
        : {}),
      createdAt: now,
    });
  },
});

export const updateTemplateVisibility = mutation({
  args: {
    templateId: v.id("workout_templates"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    visibility: templateVisibility,
    showWeights: v.boolean(),
    description: v.optional(v.string()),
    exercises: v.optional(v.array(templateExerciseValidator)),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== args.userId) {
      throw new Error("Template not found.");
    }

    const now = Date.now();
    const nextExercises = args.exercises
      ? sanitizeTemplateExercises(args.exercises)
      : null;
    if (nextExercises && nextExercises.length === 0) {
      throw new Error("A playlist needs at least one exercise.");
    }
    const exercisesChanged =
      nextExercises !== null &&
      !templateExercisesEqual(template.exercises, nextExercises);
    const nextVersion = exercisesChanged ? (template.version ?? 1) + 1 : template.version ?? 1;
    const changeSummary = exercisesChanged
      ? describeTemplateExerciseChanges(template.exercises, nextExercises)
      : undefined;

    await ctx.db.patch(args.templateId, {
      name: args.name?.trim().slice(0, 80) || template.name,
      visibility: args.visibility,
      showWeights: args.showWeights,
      description: args.description?.trim().slice(0, 180),
      updatedAt: now,
      ...(nextExercises ? { exercises: nextExercises } : {}),
      ...(exercisesChanged
        ? {
            version: nextVersion,
            lastChangeSummary: changeSummary,
          }
        : {}),
    });

    if (exercisesChanged && changeSummary) {
      const savedCopies = await ctx.db
        .query("workout_templates")
        .withIndex("by_source_template", (q) =>
          q.eq("sourceTemplateId", args.templateId)
        )
        .take(100);

      for (const copy of savedCopies) {
        if (copy.sourceTemplateVersion === nextVersion) continue;
        await ctx.db.patch(copy._id, {
          pendingSourceUpdate: {
            sourceTemplateId: args.templateId,
            sourceVersion: nextVersion,
            createdAt: now,
            summary: changeSummary,
          },
        });
      }
    }
  },
});

export const acceptTemplateUpdate = mutation({
  args: {
    templateId: v.id("workout_templates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== args.userId) {
      throw new Error("Template not found.");
    }
    const pending = template.pendingSourceUpdate;
    if (!pending) return false;

    const source = await ctx.db.get(pending.sourceTemplateId);
    if (!source) {
      await ctx.db.patch(args.templateId, { pendingSourceUpdate: undefined });
      throw new Error("The original playlist is no longer available.");
    }

    await ctx.db.patch(args.templateId, {
      exercises: source.exercises,
      sourceTemplateVersion: pending.sourceVersion,
      pendingSourceUpdate: undefined,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const keepTemplateVersion = mutation({
  args: {
    templateId: v.id("workout_templates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== args.userId) {
      throw new Error("Template not found.");
    }
    const pending = template.pendingSourceUpdate;
    if (!pending) return false;

    await ctx.db.patch(args.templateId, {
      sourceTemplateVersion: pending.sourceVersion,
      pendingSourceUpdate: undefined,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const deleteTemplate = mutation({
  args: {
    templateId: v.id("workout_templates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== args.userId) {
      throw new Error("Template not found.");
    }

    await ctx.db.delete(args.templateId);
    return true;
  },
});

async function areFriends(
  ctx: QueryCtx | MutationCtx,
  a: Id<"users">,
  b: Id<"users">
) {
  const requesterId = a < b ? a : b;
  const addresseeId = a < b ? b : a;
  const friendship = await ctx.db
    .query("friends")
    .withIndex("by_pair", (q) =>
      q.eq("requesterId", requesterId).eq("addresseeId", addresseeId)
    )
    .unique();
  return friendship?.status === "accepted";
}

async function canUseTemplate(
  ctx: QueryCtx | MutationCtx,
  templateUserId: Id<"users">,
  viewerId: Id<"users">
) {
  if (templateUserId === viewerId) return true;
  return await areFriends(ctx, templateUserId, viewerId);
}

export const listProfileTemplates = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const isSelf = args.viewerId === args.userId;
    const canSeeFriends = args.viewerId
      ? isSelf || (await areFriends(ctx, args.userId, args.viewerId))
      : false;

    const templates = await ctx.db
      .query("workout_templates")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 12);

    return templates
      .filter((template) => {
        const visibility = template.visibility ?? "private";
        if (isSelf) return true;
        if (visibility === "public") return true;
        if (visibility === "friends") return canSeeFriends;
        return false;
      })
      .map((template) => {
        const showWeights = isSelf || template.showWeights === true;
        return {
          ...template,
          visibility: template.visibility ?? "private",
          showWeights: template.showWeights ?? false,
          executionCount: template.executionCount ?? 0,
          pendingSourceUpdate: isSelf ? template.pendingSourceUpdate : undefined,
          lastChangeSummary: isSelf ? template.lastChangeSummary : undefined,
          exercises: template.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) => ({
              reps: set.reps,
              weight: showWeights ? set.weight : null,
            })),
          })),
          totalExercises: template.exercises.length,
          totalSets: template.exercises.reduce(
            (sum, exercise) => sum + exercise.sets.length,
            0
          ),
          totalVolume: showWeights
            ? template.exercises.reduce(
                (sum, exercise) =>
                  sum +
                  exercise.sets.reduce(
                    (exerciseSum, set) => exerciseSum + set.weight * set.reps,
                    0
                  ),
                0
              )
            : null,
        };
      });
  },
});

export const getTemplateForStart = query({
  args: {
    templateId: v.id("workout_templates"),
    viewerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) return null;

    const visibility = template.visibility ?? "private";
    const isSelf = template.userId === args.viewerId;
    const canSee =
      isSelf ||
      visibility === "public" ||
      (visibility === "friends" &&
        (await canUseTemplate(ctx, template.userId, args.viewerId)));

    if (!canSee) return null;

    const showWeights = isSelf || template.showWeights === true;
    return {
      _id: template._id,
      userId: template.userId,
      name: template.name,
      description: template.description,
      visibility,
      showWeights: template.showWeights ?? false,
      executionCount: template.executionCount ?? 0,
      exercises: template.exercises.map((exercise) => ({
        exerciseName: exercise.exerciseName,
        muscleGroup: exercise.muscleGroup,
        category: exercise.category,
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weight: showWeights ? set.weight : null,
        })),
      })),
      totalExercises: template.exercises.length,
      totalSets: template.exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0
      ),
      totalVolume: showWeights
        ? template.exercises.reduce(
            (sum, exercise) =>
              sum +
              exercise.sets.reduce(
                (exerciseSum, set) => exerciseSum + set.weight * set.reps,
                0
              ),
            0
          )
        : null,
    };
  },
});

export const startFromTemplate = mutation({
  args: {
    templateId: v.id("workout_templates"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found.");

    const visibility = template.visibility ?? "private";
    const canStart =
      template.userId === args.userId ||
      visibility === "public" ||
      (visibility === "friends" &&
        (await canUseTemplate(ctx, template.userId, args.userId)));

    if (!canStart) throw new Error("Template not available.");

    const includeWeights =
      template.userId === args.userId || template.showWeights === true;
    const workoutId = await ctx.db.insert("workouts", {
      userId: args.userId,
      date: Date.now(),
      notes: `From template: ${template.name}`,
      sourceTemplateId: template._id,
      isCompleted: false,
    });

    let setOrder = 0;
    for (const exercise of template.exercises) {
      for (const set of exercise.sets) {
        await ctx.db.insert("sets", {
          workoutId,
          exerciseId: exercise.exerciseId,
          userId: args.userId,
          weight: includeWeights ? set.weight : 0,
          reps: set.reps,
          setOrder,
          createdAt: Date.now(),
        });
        setOrder += 1;
      }
    }

    return workoutId;
  },
});

export const updateNotes = mutation({
  args: { workoutId: v.id("workouts"), notes: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workoutId, { notes: args.notes });
  },
});

export const remove = mutation({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    // Delete all sets in this workout
    const sets = await ctx.db
      .query("sets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();
    for (const set of sets) {
      await ctx.db.delete(set._id);
    }
    await ctx.db.delete(args.workoutId);
  },
});
