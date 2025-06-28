/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as goals from "../goals.js";
import type * as http_polar from "../http/polar.js";
import type * as mutations_subscription from "../mutations/subscription.js";
import type * as queries_subscription from "../queries/subscription.js";
import type * as queries_userPreferences from "../queries/userPreferences.js";
import type * as scorecards from "../scorecards.js";
import type * as subscription from "../subscription.js";
import type * as tasks from "../tasks.js";
import type * as userPreferences from "../userPreferences.js";
import type * as utils_subscription from "../utils/subscription.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  goals: typeof goals;
  "http/polar": typeof http_polar;
  "mutations/subscription": typeof mutations_subscription;
  "queries/subscription": typeof queries_subscription;
  "queries/userPreferences": typeof queries_userPreferences;
  scorecards: typeof scorecards;
  subscription: typeof subscription;
  tasks: typeof tasks;
  userPreferences: typeof userPreferences;
  "utils/subscription": typeof utils_subscription;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
