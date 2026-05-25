import { v } from "convex/values";

export const mentorshipStatusValidator = v.union(
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled")
);

export const mentorshipsTableFields = {
  mentorId: v.id("users"),
  menteeId: v.id("users"),
  startDate: v.number(),
  endDate: v.number(),
  status: mentorshipStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
};