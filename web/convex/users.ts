import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // 1. Look up the user by their unique Auth0 identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    // 2. If they exist, return their internal Convex ID
    if (user !== null) {
      return user._id;
    }

    // 3. If new, create the bridge record
    return await ctx.db.insert("users", {
      name: identity.name ?? "",
      dateOfBirth: 0,
      gender: "",
      nationality: "",
      tokenIdentifier: identity.tokenIdentifier, // THE LINK
      profilePictureUrl: "",
      bio: "",
      location: "",
      email: identity.email ?? "",
      phoneNumber: "",
      education: [],
      experience: [],
      // Mentee/Mentor profiles stay empty until they set them up
      // so we omit menteeProfile and mentorProfile here on purpose.
      createdAt: Date.now(),
    });
  },
});