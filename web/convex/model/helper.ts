import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Loads a set of users by ID.
 */
export async function fetchUsersById(
  ctx: QueryCtx | MutationCtx,
  ids: Id<"users">[]
): Promise<Map<Id<"users">, Doc<"users"> | null>> {
  const unique = [...new Set(ids)];
  const docs = await Promise.all(unique.map((id) => ctx.db.get("users", id)));
  return new Map(unique.map((id, i) => [id, docs[i] ?? null]));
}