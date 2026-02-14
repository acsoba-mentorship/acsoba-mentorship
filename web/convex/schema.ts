import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const users = defineTable({
  // Personal information
  name: v.string(),
  dateOfBirth: v.number(),
  gender: v.string(),
  nationality: v.string(),
  tokenIdentifier: v.string(), // Auth0 ID token

  profilePictureUrl: v.string(),
  bio: v.string(),
  location: v.string(),

  // Contact details
  email: v.string(),
  phoneNumber: v.string(),

  // Shared professional details
  education: v.array(
    v.object({
      institution: v.string(),
      degree: v.string(),
      fieldOfStudy: v.string(),
      startDate: v.number(),
      endDate: v.number(),
    })
  ),
  experience: v.array(
    v.object({
      company: v.string(),
      title: v.string(),
      startDate: v.number(),
      endDate: v.number(),
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
    v.literal("verification_pending"),
    v.literal("verified"),
    v.literal("profile_setup_complete")
  ),

  createdAt: v.number(),
})
  .index("by_token", ["tokenIdentifier"])
  .index("by_mentor_availability", ["mentorProfile.isAvailable"])

// TODO: Create mentorship requests table -- represents the request for a mentorship by mentee
// mentorId, menteeId, status, requestMessage, createdAt, updatedAt

// TODO: Create mentorships table -- represents the successful connection between a mentor and a mentee
// mentorId, menteeId, startDate, endDate, status, createdAt, updatedAt

export default defineSchema({
  users,
});

