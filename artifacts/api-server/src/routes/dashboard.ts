import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable, expensesTable, auditLogsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse as DashboardSummary,
  ListAuditLogsResponseItem as AuditLog,
} from "@workspace/api-zod";
import { desc, eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req: Request, res: Response) => {
  const projectAgg = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${projectsTable.status} = 'active')::int`,
      budget: sql<string>`coalesce(sum(${projectsTable.budget}), 0)`,
      beneficiaries: sql<number>`coalesce(sum(${projectsTable.beneficiaries}), 0)::int`,
    })
    .from(projectsTable);

  const expenseAgg = await db
    .select({
      spent: sql<string>`coalesce(sum(${expensesTable.amount}), 0)`,
      flaggedCount: sql<number>`count(*) filter (where ${expensesTable.flagged} = true)::int`,
    })
    .from(expensesTable);

  const categories = await db
    .select({
      category: expensesTable.category,
      count: sql<number>`count(*)::int`,
      spent: sql<string>`coalesce(sum(${expensesTable.amount}), 0)`,
    })
    .from(expensesTable)
    .groupBy(expensesTable.category)
    .orderBy(desc(sql<string>`coalesce(sum(${expensesTable.amount}), 0)`));

  const projects = await db.select().from(projectsTable);
  const utilizations = await Promise.all(
    projects.map(async (p) => {
      const [a] = await db
        .select({ total: sql<string>`coalesce(sum(${expensesTable.amount}), 0)` })
        .from(expensesTable)
        .where(eq(expensesTable.projectId, p.id));
      const budget = Number(p.budget);
      const spent = Number(a?.total ?? 0);
      return budget > 0 ? (spent / budget) * 100 : 0;
    }),
  );
  const avgUtil =
    utilizations.length === 0
      ? 0
      : utilizations.reduce((acc, v) => acc + v, 0) / utilizations.length;

  const recent = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(8);

  const totalBudget = Number(projectAgg[0]?.budget ?? 0);
  const totalSpent = Number(expenseAgg[0]?.spent ?? 0);

  res.json(
    DashboardSummary.parse({
      totalProjects: projectAgg[0]?.total ?? 0,
      activeProjects: projectAgg[0]?.active ?? 0,
      totalBudget: totalBudget.toFixed(2),
      totalSpent: totalSpent.toFixed(2),
      totalRemaining: (totalBudget - totalSpent).toFixed(2),
      totalBeneficiaries: projectAgg[0]?.beneficiaries ?? 0,
      flaggedExpenseCount: expenseAgg[0]?.flaggedCount ?? 0,
      averageUtilizationPercent: Math.round(avgUtil * 10) / 10,
      categoryBreakdown: categories.map((c) => ({
        category: c.category,
        count: c.count,
        spent: Number(c.spent).toFixed(2),
      })),
      recentActivity: recent.map((r) =>
        AuditLog.parse({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }),
      ),
    }),
  );
});

export default router;
