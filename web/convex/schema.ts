import { defineSchema, defineTable } from "convex/server";
import { mentorshipRequestsTableFields } from "./model/mentorRequests/fields";
import { usersTableFields } from "./model/users/fields";
import { mentorshipsTableFields } from "./model/mentorships/fields";
import { mentorshipGoalsTableFields } from "./model/mentorshipGoals/fields";
import { mentorshipTodosTableFields } from "./model/mentorshipTodos/fields";
import { mentorshipMeetingsTableFields } from "./model/mentorshipMeetings/fields";
import { mentorshipPulseSurveysTableFields } from "./model/pulseSurveys/fields";
import {
  adminBootstrapStateTableFields,
  adminAuditLogTableFields,
  adminMembershipsTableFields,
  programSettingsTableFields,
} from "./model/admin/fields";
import { notificationsTableFields } from "./model/notifications/fields";
import { incidentReportsTableFields } from "./model/incidentReports/fields";
import { exitFeedbackTableFields } from "./model/exitFeedback/fields";
import {
  internshipsTableFields,
  internshipInterestsTableFields,
} from "./model/internships/fields";

const users = defineTable(usersTableFields)
  .index("by_token", ["tokenIdentifier"])
  .index("by_username", ["username"])
  .index("by_email", ["email"])
  .index("by_auth_email", ["authEmailNormalized"])
  .index("by_mentor_availability", ["mentorProfile.isAvailable"]);

const mentorshipRequests = defineTable(mentorshipRequestsTableFields)
  .index("by_mentorId", ["mentorId"])
  .index("by_menteeId", ["menteeId"])
  .index("by_mentorId_status", ["mentorId", "status"])
  .index("by_menteeId_status", ["menteeId", "status"])
  .index("by_mentorId_menteeId", ["mentorId", "menteeId"])
  .index("by_status_expiresAt", ["status", "expiresAt"]);

const mentorships = defineTable(mentorshipsTableFields)
  .index("by_mentorId", ["mentorId"])
  .index("by_menteeId", ["menteeId"])
  .index("by_mentorId_status", ["mentorId", "status"])
  .index("by_menteeId_status", ["menteeId", "status"])
  .index("by_mentorId_menteeId", ["mentorId", "menteeId"])
  .index("by_requestId", ["requestId"])
  .index("by_status", ["status"]);

const mentorshipGoals = defineTable(mentorshipGoalsTableFields)
  .index("by_mentorshipId", ["mentorshipId"])
  .index("by_mentorshipId_status", ["mentorshipId", "status"])
  .index("by_createdBy", ["createdBy"]);

const mentorshipTodos = defineTable(mentorshipTodosTableFields)
  .index("by_mentorshipId", ["mentorshipId"])
  .index("by_goalId", ["goalId"])
  .index("by_assignedTo", ["assignedTo"])
  .index("by_mentorshipId_completed", ["mentorshipId", "completed"]);

const mentorshipMeetings = defineTable(mentorshipMeetingsTableFields)
  .index("by_mentorshipId", ["mentorshipId"])
  .index("by_mentorshipId_startAt", ["mentorshipId", "startAt"])
  .index("by_mentorshipId_status", ["mentorshipId", "status"]);

const mentorshipPulseSurveys = defineTable(mentorshipPulseSurveysTableFields)
  .index("by_mentorshipId", ["mentorshipId"])
  .index("by_status_dueAt", ["status", "dueAt"])
  .index("by_respondentId_status", ["respondentId", "status"])
  .index("by_mentorshipId_respondentId_status", [
    "mentorshipId",
    "respondentId",
    "status",
  ])
  .index("by_mentorshipId_cycleNumber_respondentRole", [
    "mentorshipId",
    "cycleNumber",
    "respondentRole",
  ]);

const adminMemberships = defineTable(adminMembershipsTableFields)
  .index("by_normalized_email", ["normalizedEmail"])
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_status_role", ["status", "role"]);

const adminBootstrapState = defineTable(
  adminBootstrapStateTableFields
).index("by_key", ["key"]);

const programSettings = defineTable(programSettingsTableFields).index(
  "by_key",
  ["key"]
);

const adminAuditLogs = defineTable(adminAuditLogTableFields)
  .index("by_actorId", ["actorId"])
  .index("by_createdAt", ["createdAt"]);

const notifications = defineTable(notificationsTableFields)
  .index("by_userId", ["userId"])
  .index("by_userId_readAt", ["userId", "readAt"]);

const incidentReports = defineTable(incidentReportsTableFields)
  .index("by_reporterId", ["reporterId"])
  .index("by_status", ["status"])
  .index("by_mentorshipId", ["mentorshipId"]);

const exitFeedback = defineTable(exitFeedbackTableFields)
  .index("by_mentorshipId", ["mentorshipId"])
  .index("by_respondentId_status", ["respondentId", "status"])
  .index("by_mentorshipId_respondentId", ["mentorshipId", "respondentId"])
  .index("by_status_dueAt", ["status", "dueAt"]);

const internships = defineTable(internshipsTableFields)
  .index("by_offerorId", ["offerorId"])
  .index("by_status", ["status"])
  .index("by_status_closingDate", ["status", "closingDate"]);

const internshipInterests = defineTable(internshipInterestsTableFields)
  .index("by_internshipId", ["internshipId"])
  .index("by_applicantId", ["applicantId"])
  .index("by_internshipId_applicantId", ["internshipId", "applicantId"])
  .index("by_internshipId_status", ["internshipId", "status"]);

export default defineSchema({
  users,
  mentorshipRequests,
  mentorships,
  mentorshipGoals,
  mentorshipTodos,
  mentorshipMeetings,
  mentorshipPulseSurveys,
  adminMemberships,
  adminBootstrapState,
  programSettings,
  adminAuditLogs,
  notifications,
  incidentReports,
  exitFeedback,
  internships,
  internshipInterests,
});
