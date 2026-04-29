import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable, expensesTable } from "@workspace/db";
import {
  CreateProjectBody,
  ListProjectsResponseItem as ProjectSummary,
  GetProjectResponse as ProjectDetail,
} from "@workspace/api-zod";
import { desc, eq, sql } from "drizzle-orm";
import { recordAudit } from "../lib/audit";

const router: IRouter = Router();

async function summarizeProject(projectRow: typeof projectsTable.$inferSelect) {
  const [agg] = await db
    .select({
      total: sql<string>`coalesce(sum(${expensesTable.amount}), 0)`,
      count: sql<number>`count(*)::int`,
      flagged: sql<number>`count(*) filter (where ${expensesTable.flagged} = true)::int`,
    })
    .from(expensesTable)
    .where(eq(expensesTable.projectId, projectRow.id));

  const totalSpent = Number(agg?.total ?? 0);
  const budget = Number(projectRow.budget);
  const remaining = budget - totalSpent;
  const utilization = budget > 0 ? (totalSpent / budget) * 100 : 0;

  return {
    ...projectRow,
    budget: projectRow.budget,
    startDate: projectRow.startDate.toISOString(),
    createdAt: projectRow.createdAt.toISOString(),
    updatedAt: projectRow.updatedAt.toISOString(),
    totalSpent: totalSpent.toFixed(2),
    remaining: remaining.toFixed(2),
    expenseCount: Number(agg?.count ?? 0),
    flaggedCount: Number(agg?.flagged ?? 0),
    utilizationPercent: Math.round(utilization * 10) / 10,
  };
}

router.get("/projects", async (_req: Request, res: Response) => {
  const rows = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
  const summaries = await Promise.all(rows.map(summarizeProject));
  res.json(summaries.map((s) => ProjectSummary.parse(s)));
});

router.post("/projects", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid project data", issues: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  try {
    const [created] = await db
      .insert(projectsTable)
      .values({
        name: data.name,
        slug: data.slug,
        category: data.category,
        location: data.location,
        description: data.description,
        budget: data.budget,
        beneficiaries: data.beneficiaries,
        status: data.status ?? "active",
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        createdBy: req.user.id,
      })
      .returning();

    await recordAudit(req, {
      action: "create",
      entityType: "project",
      entityId: created.id,
      summary: `Created project "${created.name}"`,
      metadata: {
        budget: created.budget,
        category: created.category,
        beneficiaries: created.beneficiaries,
      },
    });

    const summary = await summarizeProject(created);
    res.status(201).json(ProjectSummary.parse(summary));
  } catch (err) {
    req.log.error({ err }, "Failed to create project");
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.get("/projects/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const summary = await summarizeProject(row);
  const recent = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.projectId, id))
    .orderBy(desc(expensesTable.spentAt))
    .limit(10);

  res.json(
    ProjectDetail.parse({
      ...summary,
      recentExpenses: recent.map((e) => ({
        ...e,
        spentAt: e.spentAt.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    }),
  );
});

export default router;
