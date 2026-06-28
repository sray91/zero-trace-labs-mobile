/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as brokerExposures from "../brokerExposures.js";
import type * as brokerSeed from "../brokerSeed.js";
import type * as dashboard from "../dashboard.js";
import type * as dataSources from "../dataSources.js";
import type * as http from "../http.js";
import type * as inbox from "../inbox.js";
import type * as removalRequests from "../removalRequests.js";
import type * as scanner from "../scanner.js";
import type * as scannerInternal from "../scannerInternal.js";
import type * as searchHistory from "../searchHistory.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  brokerExposures: typeof brokerExposures;
  brokerSeed: typeof brokerSeed;
  dashboard: typeof dashboard;
  dataSources: typeof dataSources;
  http: typeof http;
  inbox: typeof inbox;
  removalRequests: typeof removalRequests;
  scanner: typeof scanner;
  scannerInternal: typeof scannerInternal;
  searchHistory: typeof searchHistory;
  subscriptions: typeof subscriptions;
  users: typeof users;
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
