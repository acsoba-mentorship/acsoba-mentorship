import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";

export async function writeAdminAuditLog(
  ctx: MutationCtx,
  {
    actorId,
    action,
    targetType,
    targetId,
    targetEmail,
    targetUserId,
    reason,
    metadata,
  }: {
    actorId: Id<"users">;
    action: string;
    targetType?: string;
    targetId?: string;
    targetEmail?: string;
    targetUserId?: Id<"users">;
    reason?: string;
    metadata?: Record<string, unknown>;
  }
) {
  return ctx.db.insert("adminAuditLogs", {
    actorId,
    action,
    targetType,
    targetId,
    targetEmail,
    targetUserId,
    reason,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
    createdAt: Date.now(),
  });
}
