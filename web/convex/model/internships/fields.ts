import { v } from "convex/values";

/**
 * FR17 — Internships.
 *
 * "Any users can offer internships ... Internship offeror must have
 * authority to do so ... Only ACSOBA members who are still in school or
 * not employed can indicate interest in these internships."
 */

export const internshipStatusValidator = v.union(
  v.literal("open"),
  v.literal("filled"),
  v.literal("closed")
);

export const internshipsTableFields = {
  offerorId: v.id("users"),
  companyName: v.string(),
  role: v.string(),
  description: v.string(),
  startPeriod: v.optional(v.string()),
  duration: v.string(),
  isPaid: v.boolean(),
  closingDate: v.number(),
  confirmedAuthority: v.boolean(),
  status: internshipStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
  // Set only when an administrator takes the posting down (as opposed to
  // the offeror closing/filling it themselves), so the admin dashboard can
  // move it into a separate "taken down" history tab.
  takenDownAt: v.optional(v.number()),
  takenDownReason: v.optional(v.string()),
  takenDownBy: v.optional(v.id("users")),
};

export const internshipInterestStatusValidator = v.union(
  v.literal("submitted"),
  // Retained so existing records migrate without a destructive rewrite.
  v.literal("acknowledged"),
  v.literal("accepted"),
  v.literal("rejected")
);

export const internshipAcceptanceContactMethodValidator = v.union(
  v.literal("email"),
  v.literal("phone"),
  v.literal("whatsapp"),
  v.literal("other")
);

export const internshipInterestsTableFields = {
  internshipId: v.id("internships"),
  applicantId: v.id("users"),
  note: v.optional(v.string()),
  cvStorageId: v.optional(v.id("_storage")),
  cvFileName: v.optional(v.string()),
  cvContentType: v.optional(v.string()),
  cvSize: v.optional(v.number()),
  status: internshipInterestStatusValidator,
  createdAt: v.number(),
  acknowledgedAt: v.optional(v.number()),
  decisionMessage: v.optional(v.string()),
  acceptanceContactMethod: v.optional(
    internshipAcceptanceContactMethodValidator
  ),
  acceptanceContactDetails: v.optional(v.string()),
  acceptanceStartArrangements: v.optional(v.string()),
  decidedAt: v.optional(v.number()),
};
