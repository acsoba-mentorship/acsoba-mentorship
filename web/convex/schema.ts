import { defineSchema, defineTable } from "convex/server";
import { mentorshipRequestsTableFields } from "./model/mentorRequests/fields";
import { usersTableFields } from "./model/users/fields";

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

// TODO: Create mentorships table -- represents the successful connection between a mentor and a mentee
// mentorId, menteeId, startDate, endDate, status, createdAt, updatedAt

export default defineSchema({
  users,
  mentorshipRequests,
});
