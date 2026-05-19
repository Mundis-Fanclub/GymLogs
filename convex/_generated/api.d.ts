/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as exercises from "../exercises.js";
import type * as friends from "../friends.js";
import type * as logs from "../logs.js";
import type * as messages from "../messages.js";
import type * as prs from "../prs.js";
import type * as restPreferences from "../restPreferences.js";
import type * as seed from "../seed.js";
import type * as sets from "../sets.js";
import type * as social from "../social.js";
import type * as users from "../users.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  exercises: typeof exercises;
  friends: typeof friends;
  logs: typeof logs;
  messages: typeof messages;
  prs: typeof prs;
  restPreferences: typeof restPreferences;
  seed: typeof seed;
  sets: typeof sets;
  social: typeof social;
  users: typeof users;
  workouts: typeof workouts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
