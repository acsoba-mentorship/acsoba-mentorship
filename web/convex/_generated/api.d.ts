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
import type * as crons from "../crons.js";
import type * as exitFeedback from "../exitFeedback.js";
import type * as helper from "../helper.js";
import type * as init from "../init.js";
import type * as incidentReports from "../incidentReports.js";
import type * as mentorRequests from "../mentorRequests.js";
import type * as mentorshipMeetings from "../mentorshipMeetings.js";
import type * as mentorshipWorkspace from "../mentorshipWorkspace.js";
import type * as mentorships from "../mentorships.js";
import type * as notifications from "../notifications.js";
import type * as programSettings from "../programSettings.js";
import type * as model_admin from "../model/admin.js";
import type * as model_admin_audit from "../model/admin/audit.js";
import type * as model_admin_bootstrap from "../model/admin/bootstrap.js";
import type * as model_admin_fields from "../model/admin/fields.js";
import type * as model_auth from "../model/auth.js";
import type * as model_exitFeedback from "../model/exitFeedback.js";
import type * as model_exitFeedback_fields from "../model/exitFeedback/fields.js";
import type * as model_helper from "../model/helper.js";
import type * as model_incidentReports from "../model/incidentReports.js";
import type * as model_incidentReports_fields from "../model/incidentReports/fields.js";
import type * as model_mentorRequests from "../model/mentorRequests.js";
import type * as model_mentorRequests_fields from "../model/mentorRequests/fields.js";
import type * as model_mentorshipGoals_fields from "../model/mentorshipGoals/fields.js";
import type * as model_mentorshipMeetings from "../model/mentorshipMeetings.js";
import type * as model_mentorshipMeetings_fields from "../model/mentorshipMeetings/fields.js";
import type * as model_mentorshipTodos_fields from "../model/mentorshipTodos/fields.js";
import type * as model_mentorshipWorkspace from "../model/mentorshipWorkspace.js";
import type * as model_mentorships from "../model/mentorships.js";
import type * as model_mentorships_fields from "../model/mentorships/fields.js";
import type * as model_notifications from "../model/notifications.js";
import type * as model_notifications_fields from "../model/notifications/fields.js";
import type * as model_programSettings from "../model/programSettings.js";
import type * as model_pulseSurveys from "../model/pulseSurveys.js";
import type * as model_pulseSurveys_fields from "../model/pulseSurveys/fields.js";
import type * as model_users from "../model/users.js";
import type * as model_users_fields from "../model/users/fields.js";
import type * as model_users_validators from "../model/users/validators.js";
import type * as pulseSurveys from "../pulseSurveys.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  crons: typeof crons;
  exitFeedback: typeof exitFeedback;
  helper: typeof helper;
  init: typeof init;
  incidentReports: typeof incidentReports;
  mentorRequests: typeof mentorRequests;
  mentorshipMeetings: typeof mentorshipMeetings;
  mentorshipWorkspace: typeof mentorshipWorkspace;
  mentorships: typeof mentorships;
  notifications: typeof notifications;
  programSettings: typeof programSettings;
  "model/admin": typeof model_admin;
  "model/admin/audit": typeof model_admin_audit;
  "model/admin/bootstrap": typeof model_admin_bootstrap;
  "model/admin/fields": typeof model_admin_fields;
  "model/auth": typeof model_auth;
  "model/exitFeedback": typeof model_exitFeedback;
  "model/exitFeedback/fields": typeof model_exitFeedback_fields;
  "model/helper": typeof model_helper;
  "model/incidentReports": typeof model_incidentReports;
  "model/incidentReports/fields": typeof model_incidentReports_fields;
  "model/mentorRequests": typeof model_mentorRequests;
  "model/mentorRequests/fields": typeof model_mentorRequests_fields;
  "model/mentorshipGoals/fields": typeof model_mentorshipGoals_fields;
  "model/mentorshipMeetings": typeof model_mentorshipMeetings;
  "model/mentorshipMeetings/fields": typeof model_mentorshipMeetings_fields;
  "model/mentorshipTodos/fields": typeof model_mentorshipTodos_fields;
  "model/mentorshipWorkspace": typeof model_mentorshipWorkspace;
  "model/mentorships": typeof model_mentorships;
  "model/mentorships/fields": typeof model_mentorships_fields;
  "model/notifications": typeof model_notifications;
  "model/notifications/fields": typeof model_notifications_fields;
  "model/programSettings": typeof model_programSettings;
  "model/pulseSurveys": typeof model_pulseSurveys;
  "model/pulseSurveys/fields": typeof model_pulseSurveys_fields;
  "model/users": typeof model_users;
  "model/users/fields": typeof model_users_fields;
  "model/users/validators": typeof model_users_validators;
  pulseSurveys: typeof pulseSurveys;
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
