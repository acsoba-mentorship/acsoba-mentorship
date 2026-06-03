/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as helper from "../helper.js";
import type * as init from "../init.js";
import type * as mentorRequests from "../mentorRequests.js";
import type * as mentorships from "../mentorships.js";
import type * as model_auth from "../model/auth.js";
import type * as model_mentorRequests from "../model/mentorRequests.js";
import type * as model_mentorRequests_fields from "../model/mentorRequests/fields.js";
import type * as model_mentorships from "../model/mentorships.js";
import type * as model_mentorships_fields from "../model/mentorships/fields.js";
import type * as model_users from "../model/users.js";
import type * as model_users_fields from "../model/users/fields.js";
import type * as model_users_validators from "../model/users/validators.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  helper: typeof helper;
  init: typeof init;
  mentorRequests: typeof mentorRequests;
  mentorships: typeof mentorships;
  "model/auth": typeof model_auth;
  "model/mentorRequests": typeof model_mentorRequests;
  "model/mentorRequests/fields": typeof model_mentorRequests_fields;
  "model/mentorships": typeof model_mentorships;
  "model/mentorships/fields": typeof model_mentorships_fields;
  "model/users": typeof model_users;
  "model/users/fields": typeof model_users_fields;
  "model/users/validators": typeof model_users_validators;
  users: typeof users;
  verification: typeof verification;
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
