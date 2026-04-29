import { pgTable, serial, text, integer, numeric, timestamp, varchar, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  vendor: text("vendor").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  receiptPath: varchar("receipt_path"),
  riskScore: integer("risk_score").notNull().default(0),
  riskFlags: jsonb("risk_flags").$type<string[]>().notNull().default([]),
  riskReasoning: text("risk_reasoning"),
  flagged: boolean("flagged").notNull().default(false),
  spentAt: timestamp("spent_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  riskScore: true,
  riskFlags: true,
  riskReasoning: true,
  flagged: true,
});
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
