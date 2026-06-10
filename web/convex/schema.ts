import { defineSchema, defineTable } from "convex/server";
import { mentorshipRequestsTableFields } from "./model/mentorRequests/fields";
import { usersTableFields } from "./model/users/fields";
import { mentorshipsTableFields } from "./model/mentorships/fields";
import { mentorshipGoalsTableFields } from "./model/mentorshipGoals/fields";
import { mentorshipTodosTableFields } from "./model/mentorshipTodos/fields";
import { mentorshipMeetingsTableFields } from "./model/mentorshipMeetings/fields";

const users = defineTable(usersTableFields)
  .index("by_token", ["tokenIdentifier"])
  .index("by_username", ["username"])
  .index("by_mentor_availability", ["mentorProfile.isAvailable"]);

const mentorshipRequests = defineTable(mentorshipRequestsTableFields)
  .index("by_mentorId", ["mentorId"])
  .index("by_menteeId", ["menteeId"])
  .index("by_mentorId_status", ["mentorId", "status"])
  .index("by_menteeId_status", ["menteeId", "status"])
  .index("by_mentorId_menteeId", ["mentorId", "menteeId"]);

const mentorships = defineTable(mentorshipsTableFields)
  .index("by_mentorId", ["mentorId"])
  .index("by_menteeId", ["menteeId"])
  .index("by_mentorId_status", ["mentorId", "status"])
  .index("by_menteeId_status", ["menteeId", "status"])
  .index("by_mentorId_menteeId", ["mentorId", "menteeId"])
  .index("by_requestId", ["requestId"]);

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

export default defineSchema({
  users,
  mentorshipRequests,
  mentorships,
  mentorshipGoals,
  mentorshipTodos,
  mentorshipMeetings,
});