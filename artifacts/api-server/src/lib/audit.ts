import { type Request } from "express";
import { db, auditLogsTable } from "@workspace/db";

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: number;
  summary: string;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(req: Request, entry: AuditEntry): Promise<void> {
  const user = req.isAuthenticated() ? req.user : undefined;
  try {
    await db.insert(auditLogsTable).values({
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      userId: user?.id,
      userEmail: user?.email,
      summary: entry.summary,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    req.log.error({ err }, "Failed to record audit log");
  }
}
