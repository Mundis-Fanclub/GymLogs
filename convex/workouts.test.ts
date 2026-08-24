/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
type TestDb = ReturnType<typeof convexTest>;

function identityFor(clerkId: string) {
  return {
    subject: clerkId,
    tokenIdentifier: `test|${clerkId}`,
  };
}

async function insertUser(
  t: TestDb,
  clerkId: string,
  role: "user" | "moderator" | "admin" = "user"
) {
  return await t.run(async (ctx) =>
    ctx.db.insert("users", {
      clerkId,
      tokenIdentifier: `test|${clerkId}`,
      name: clerkId,
      email: `${clerkId}@example.com`,
      role,
    })
  );
}

async function insertBenchPress(t: TestDb) {
  return await t.run(async (ctx) =>
    ctx.db.insert("exercises", {
      name: "Bench Press",
      muscleGroup: "chest",
      category: "push",
      isCustom: false,
      isLeaderboardLift: true,
      leaderboardLiftType: "bench_press",
    })
  );
}

describe("workouts active guard", () => {
  test("prevents starting a second active workout until the current one is completed", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "clerk-active-guard");
    const exerciseId = await insertBenchPress(t);
    const authed = t.withIdentity(identityFor("clerk-active-guard"));

    const workoutId = await authed.mutation(api.workouts.create, { userId });
    await authed.mutation(api.sets.add, {
      workoutId,
      exerciseId,
      userId,
      weight: 80,
      reps: 5,
      setOrder: 0,
    });

    await expect(authed.mutation(api.workouts.create, { userId })).rejects.toThrow(
      "ACTIVE_WORKOUT_EXISTS"
    );

    await authed.mutation(api.workouts.complete, { workoutId });

    await expect(authed.mutation(api.workouts.create, { userId })).resolves.toBeTruthy();
  });

  test("prevents template starts while active and returns the real template name", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const userId = await insertUser(t, "clerk-template-guard");
    const exerciseId = await insertBenchPress(t);
    const templateId = await t.run(async (ctx) =>
      ctx.db.insert("workout_templates", {
        userId,
        name: "Push Strength",
        visibility: "private",
        showWeights: true,
        exercises: [
          {
            exerciseId,
            exerciseName: "Bench Press",
            muscleGroup: "chest",
            category: "push",
            sets: [{ weight: 80, reps: 5 }],
          },
        ],
        createdAt: now,
      })
    );
    const authed = t.withIdentity(identityFor("clerk-template-guard"));

    const workoutId = await authed.mutation(api.workouts.startFromTemplate, {
      templateId,
      userId,
    });

    await expect(
      authed.mutation(api.workouts.startFromTemplate, { templateId, userId })
    ).rejects.toThrow("ACTIVE_WORKOUT_EXISTS");

    await expect(authed.mutation(api.workouts.create, { userId })).rejects.toThrow(
      "ACTIVE_WORKOUT_EXISTS"
    );

    await expect(authed.query(api.workouts.getActiveForNav, { userId })).resolves.toMatchObject({
      _id: workoutId,
      name: "Push Strength",
    });
    await expect(authed.query(api.workouts.get, { workoutId })).resolves.toMatchObject({
      sourceTemplateName: "Push Strength",
    });
  });
});

describe("workout ownership", () => {
  test("blocks foreign users from reading or mutating another user's workout sets", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await insertUser(t, "clerk-owner");
    await insertUser(t, "clerk-other");
    const exerciseId = await insertBenchPress(t);
    const owner = t.withIdentity(identityFor("clerk-owner"));
    const other = t.withIdentity(identityFor("clerk-other"));

    const workoutId = await owner.mutation(api.workouts.create, { userId: ownerId });
    const setId = await owner.mutation(api.sets.add, {
      workoutId,
      exerciseId,
      userId: ownerId,
      weight: 100,
      reps: 3,
      setOrder: 0,
    });

    await expect(other.query(api.workouts.get, { workoutId })).resolves.toBeNull();
    await expect(
      other.mutation(api.sets.update, {
        setId,
        weight: 120,
        reps: 3,
      })
    ).rejects.toThrow("Set not found.");
    await expect(other.mutation(api.workouts.complete, { workoutId })).rejects.toThrow(
      "Workout not found."
    );
  });
});

describe("verified log preparation", () => {
  test("creates submissions only from owned matching leaderboard sets", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await insertUser(t, "clerk-log-owner");
    await insertUser(t, "clerk-log-other");
    const exerciseId = await insertBenchPress(t);
    const owner = t.withIdentity(identityFor("clerk-log-owner"));
    const other = t.withIdentity(identityFor("clerk-log-other"));
    const workoutId = await owner.mutation(api.workouts.create, { userId: ownerId });
    const setId = await owner.mutation(api.sets.add, {
      workoutId,
      exerciseId,
      userId: ownerId,
      weight: 140,
      reps: 2,
      setOrder: 0,
    });

    await expect(
      owner.mutation(api.logs.createSubmission, {
        exerciseId,
        workoutId,
        setId,
        liftType: "bench_press",
        weightKg: 140,
        reps: 2,
        bodyweightClass: "90kg",
        sex: "open",
        equipment: "raw",
      })
    ).resolves.toBeTruthy();

    await expect(
      owner.mutation(api.logs.createSubmission, {
        exerciseId,
        workoutId,
        setId,
        liftType: "bench_press",
        weightKg: 150,
        reps: 2,
        bodyweightClass: "90kg",
        sex: "open",
        equipment: "raw",
      })
    ).rejects.toThrow("Submission values must match the logged set.");

    await expect(
      other.mutation(api.logs.createSubmission, {
        exerciseId,
        workoutId,
        setId,
        liftType: "bench_press",
        weightKg: 140,
        reps: 2,
        bodyweightClass: "90kg",
        sex: "open",
        equipment: "raw",
      })
    ).rejects.toThrow("Workout not found.");
  });

  test("requires moderator role before a submission can reach verified status", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await insertUser(t, "clerk-review-owner");
    await insertUser(t, "clerk-review-user");
    await insertUser(t, "clerk-review-mod", "moderator");
    const exerciseId = await insertBenchPress(t);
    const owner = t.withIdentity(identityFor("clerk-review-owner"));
    const user = t.withIdentity(identityFor("clerk-review-user"));
    const moderator = t.withIdentity(identityFor("clerk-review-mod"));
    const workoutId = await owner.mutation(api.workouts.create, { userId: ownerId });
    const setId = await owner.mutation(api.sets.add, {
      workoutId,
      exerciseId,
      userId: ownerId,
      weight: 145,
      reps: 1,
      setOrder: 0,
    });
    const submissionId = await owner.mutation(api.logs.createSubmission, {
      exerciseId,
      workoutId,
      setId,
      liftType: "bench_press",
      weightKg: 145,
      reps: 1,
      bodyweightClass: "90kg",
      sex: "open",
      equipment: "raw",
    });

    await expect(
      user.mutation(api.logs.updateVerificationStatus, {
        submissionId,
        status: "verified",
      })
    ).rejects.toThrow("Moderator access required.");

    await moderator.mutation(api.logs.updateVerificationStatus, {
      submissionId,
      status: "verified",
      validationSource: "manual_review",
      validationScore: 1,
      note: "Looks valid",
    });

    await expect(
      t.query(api.logs.leaderboard, { liftType: "bench_press" })
    ).resolves.toMatchObject([
      {
        rank: 1,
        submission: { _id: submissionId, status: "verified" },
      },
    ]);
  });
});
