import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type AuthzCtx = QueryCtx | MutationCtx;

type UserUpdates = Partial<Pick<Doc<"users">, "tokenIdentifier" | "role">>;

function localMockAuthEnabled() {
  return (
    process.env.LOCAL_MOCK_AUTH === "true" ||
    process.env.CONVEX_CLOUD_URL?.startsWith("http://127.0.0.1") ||
    process.env.CONVEX_CLOUD_URL?.startsWith("http://localhost") ||
    process.env.CONVEX_SITE_URL?.startsWith("http://127.0.0.1") ||
    process.env.CONVEX_SITE_URL?.startsWith("http://localhost")
  );
}

export function sanitizeText(value: string | undefined, maxLength: number) {
  const text = value?.trim();
  return text ? text.slice(0, maxLength) : undefined;
}

export function requireFinitePositiveNumber(
  value: number,
  fieldName: string,
  max: number
) {
  if (!Number.isFinite(value) || value <= 0 || value > max) {
    throw new Error(`${fieldName} is outside the allowed range.`);
  }
  return value;
}

export function requirePositiveInteger(
  value: number,
  fieldName: string,
  max: number
) {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} is outside the allowed range.`);
  }
  const rounded = Math.round(value);
  if (rounded <= 0 || rounded > max || rounded !== value) {
    throw new Error(`${fieldName} is outside the allowed range.`);
  }
  return rounded;
}

export async function getAuthenticatedUser(ctx: AuthzCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const byToken = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();
  if (byToken) return byToken;

  const byClerkId = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  return byClerkId;
}

export async function requireAuthenticatedUser(ctx: AuthzCtx) {
  const user = await getAuthenticatedUser(ctx);
  if (!user) throw new Error("Not authenticated.");
  return user;
}

export async function requireAuthenticatedUserId(ctx: AuthzCtx) {
  const user = await requireAuthenticatedUser(ctx);
  return user._id;
}

export async function requireUserMatch(
  ctx: AuthzCtx,
  providedUserId?: Id<"users">
) {
  const user = await getAuthenticatedUser(ctx);
  if (!user && localMockAuthEnabled() && providedUserId) {
    const mockUser = await ctx.db.get(providedUserId);
    if (!mockUser) throw new Error("User not found.");
    return mockUser._id;
  }
  if (!user) throw new Error("Not authenticated.");
  if (providedUserId && user._id !== providedUserId) {
    throw new Error("Not allowed.");
  }
  return user._id;
}

export async function requireWorkoutOwner(
  ctx: AuthzCtx,
  workoutId: Id<"workouts">
) {
  const [user, workout] = await Promise.all([
    getAuthenticatedUser(ctx),
    ctx.db.get(workoutId),
  ]);
  if (!workout) {
    throw new Error("Workout not found.");
  }
  if (!user && localMockAuthEnabled()) return workout;
  if (!user || workout.userId !== user._id) throw new Error("Workout not found.");
  return workout;
}

export async function requireSetOwner(ctx: AuthzCtx, setId: Id<"sets">) {
  const [user, set] = await Promise.all([
    getAuthenticatedUser(ctx),
    ctx.db.get(setId),
  ]);
  if (!set) {
    throw new Error("Set not found.");
  }
  if (!user && localMockAuthEnabled()) return set;
  if (!user || set.userId !== user._id) throw new Error("Set not found.");
  return set;
}

export async function requireModerator(ctx: AuthzCtx) {
  const user = await requireAuthenticatedUser(ctx);
  if (user.role !== "moderator" && user.role !== "admin") {
    throw new Error("Moderator access required.");
  }
  return user;
}

export async function patchMissingIdentityFields(
  ctx: MutationCtx,
  user: Doc<"users">
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return;

  const updates: UserUpdates = {};
  if (!user.tokenIdentifier) {
    updates.tokenIdentifier = identity.tokenIdentifier;
  }
  if (!user.role) {
    updates.role = "user";
  }

  if (Object.keys(updates).length > 0) {
    await ctx.db.patch(user._id, updates);
  }
}
