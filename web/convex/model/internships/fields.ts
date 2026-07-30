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
};

export const internshipInterestStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("acknowledged")
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
};
