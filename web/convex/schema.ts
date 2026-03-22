import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const users = defineTable({
  // Personal information
  name: v.string(),
  username: v.string(),
  usernameUpdatedAt: v.number(),
  isTemporaryUsername: v.boolean(),
  dateOfBirth: v.number(),
  gender: v.string(),
  nationality: v.string(),
  tokenIdentifier: v.string(), // Auth0 ID token

  profilePictureUrl: v.string(),
  // Professional headline / job title shown in the profile header
  title: v.string(),
  bio: v.string(),
  location: v.string(),

  // Contact details
  email: v.string(),
  phoneNumber: v.string(),

  // Shared professional details
  education: v.array(
    v.object({
      institution: v.string(),
      degree: v.optional(v.string()),
      fieldOfStudy: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.optional(v.number()),
      description: v.optional(v.string()),
    })
  ),
  experience: v.array(
    v.object({
      company: v.string(),
      title: v.string(),
      startDate: v.number(),
      endDate: v.optional(v.number()),
      description: v.optional(v.string()),
    })
  ),

  // Mentee profile details
  menteeProfile: v.optional(
    v.object({
      goals: v.string(),
      interests: v.array(v.string()),
    })
  ),

  // Mentor profile details
  mentorProfile: v.optional(
    v.object({
      yearsOfExperience: v.number(),
      industries: v.array(v.string()),
      expertise: v.array(v.string()),
      maxMentees: v.number(),
      isAvailable: v.boolean(),
    })
  ),

  onboardingStatus: v.union(
    v.literal("new"),
    v.literal("verified"),
    v.literal("user_profile_complete"),
    v.literal("mentee_profile_setup_complete")
  ),

  createdAt: v.number(),
})
  .index("by_token", ["tokenIdentifier"])
<<<<<<< HEAD
  .index("by_username", ["username"])
  .index("by_mentor_availability", ["mentorProfile.isAvailable"])
=======
  .index("by_mentor_availability", ["mentorProfile.isAvailable"]);
>>>>>>> 6428825 (fix: implement mentorship requests)

const mentorshipRequests = defineTable({
  mentorId: v.id("users"),
  menteeId: v.id("users"),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("rejected")
  ),
  message: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
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
