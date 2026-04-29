import { Router, type IRouter, type Request, type Response } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { ListAuditLogsResponseItem as AuditLog } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/audit", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(200);
  res.json(
    rows.map((r) =>
      AuditLog.parse({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }),
    ),
  );
});

export default router;
