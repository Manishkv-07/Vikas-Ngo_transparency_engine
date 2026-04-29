import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable, expensesTable } from "@workspace/db";
import {
  CreateProjectExpenseBody as CreateExpenseBody,
  ListProjectExpensesResponseItem as Expense,
  ListExpensesResponseItem as ExpenseWithProject,
} from "@workspace/api-zod";
import { desc, eq, sql } from "drizzle-orm";
import { recordAudit } from "../lib/audit";
import { assessExpenseRisk } from "../lib/risk";

const router: IRouter = Router();

router.get("/projects/:id/expenses", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rows = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.projectId, id))
    .orderBy(desc(expensesTable.spentAt));
  res.json(
    rows.map((r) =>
      Expense.parse({
        ...r,
        spentAt: r.spentAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }),
    ),
  );
});

router.post("/projects/:id/expenses", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid expense data", issues: parsed.error.issues });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [agg] = await db
    .select({ total: sql<string>`coalesce(sum(${expensesTable.amount}), 0)` })
    .from(expensesTable)
    .where(eq(expensesTable.projectId, id));
  const spentSoFar = Number(agg?.total ?? 0);

  const recent = await db
    .select({
      vendor: expensesTable.vendor,
      category: expensesTable.category,
      amount: expensesTable.amount,
      description: expensesTable.description,
    })
    .from(expensesTable)
    .where(eq(expensesTable.projectId, id))
    .orderBy(desc(expensesTable.spentAt))
    .limit(10);

  const data = parsed.data;
  const amountNum = Number(data.amount);

  const risk = await assessExpenseRisk({
    vendor: data.vendor,
    category: data.category,
    description: data.description,
    amount: amountNum,
    projectName: project.name,
    projectBudget: Number(project.budget),
    projectSpentSoFar: spentSoFar,
    recentExpenses: recent.map((r) => ({ ...r, amount: Number(r.amount) })),
  });

  try {
    const [created] = await db
      .insert(expensesTable)
      .values({
        projectId: id,
        vendor: data.vendor,
        category: data.category,
        description: data.description,
        amount: data.amount,
        receiptPath: data.receiptPath ?? null,
        spentAt: data.spentAt ? new Date(data.spentAt) : new Date(),
        createdBy: req.user.id,
        riskScore: risk.riskScore,
        riskFlags: risk.riskFlags,
        riskReasoning: risk.reasoning,
        flagged: risk.flagged,
      })
      .returning();

    await recordAudit(req, {
      action: "create",
      entityType: "expense",
      entityId: created.id,
      summary: `Logged ₹${created.amount} expense "${created.description}" on ${project.name}`,
      metadata: {
        projectId: id,
        amount: created.amount,
        vendor: created.vendor,
        riskScore: created.riskScore,
        flagged: created.flagged,
        riskFlags: created.riskFlags,
      },
    });

    res.status(201).json(
      Expense.parse({
        ...created,
        spentAt: created.spentAt.toISOString(),
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to create expense");
    res.status(500).json({ error: "Failed to create expense" });
  }
});

async function listExpensesWithProject(filterFlagged: boolean) {
  const rows = await db
    .select({
      expense: expensesTable,
      projectName: projectsTable.name,
      projectSlug: projectsTable.slug,
    })
    .from(expensesTable)
    .innerJoin(projectsTable, eq(projectsTable.id, expensesTable.projectId))
    .where(filterFlagged ? eq(expensesTable.flagged, true) : sql`true`)
    .orderBy(desc(expensesTable.spentAt))
    .limit(100);

  return rows.map((r) =>
    ExpenseWithProject.parse({
      ...r.expense,
      spentAt: r.expense.spentAt.toISOString(),
      createdAt: r.expense.createdAt.toISOString(),
      updatedAt: r.expense.updatedAt.toISOString(),
      projectName: r.projectName,
      projectSlug: r.projectSlug,
    }),
  );
}

router.get("/expenses", async (_req: Request, res: Response) => {
  res.json(await listExpensesWithProject(false));
});

router.get("/expenses/flagged", async (_req: Request, res: Response) => {
  res.json(await listExpensesWithProject(true));
});

export default router;
