export type ViewMode = "grid" | "list";

export type UserRole = "mentee" | "mentor";

// Convex user types — single source of truth for user/profile data
import type { Doc, Id } from "../../convex/_generated/dataModel";

/** User document from the Convex `users` table. */
export type User = Doc<"users">;

/** Id for a user document. */
export type UserId = Id<"users">;
