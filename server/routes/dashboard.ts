import express from 'express';
import { Project } from '../models/Project';
import { Expense } from '../models/Expense';
import { AuditLog } from '../models/AuditLog';
import { Donation } from '../models/Donation';

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const projects = await Project.find().lean();
    const expenses = await Expense.find().select('amount spentAt category flagged').lean();
    const donations = await Donation.find().select('amount date').lean();
    const activeProjects = projects.filter(p => p.status === 'active');
    
    const totalProjects = projects.length;
    const totalBudget = projects.reduce((sum, p) => sum + parseFloat(p.budget), 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const totalRemaining = totalBudget - totalSpent;
    const totalBeneficiaries = projects.reduce((sum, p) => sum + p.beneficiaries, 0);
    
    const flaggedExpenseCount = expenses.filter(exp => exp.flagged).length;
    const averageUtilizationPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Category breakdown
    const categoryMap = new Map<string, { count: number, spent: number }>();
    for (const exp of expenses) {
      const existing = categoryMap.get(exp.category) || { count: 0, spent: 0 };
      categoryMap.set(exp.category, {
        count: existing.count + 1,
        spent: existing.spent + parseFloat(exp.amount)
      });
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      spent: data.spent.toString()
    }));

    const recentActivity = await AuditLog.find().sort({ createdAt: -1 }).limit(10).lean();

    res.json({
      totalProjects,
      activeProjects: activeProjects.length,
      totalBudget: totalBudget.toString(),
      totalSpent: totalSpent.toString(),
      totalRemaining: totalRemaining.toString(),
      totalBeneficiaries,
      flaggedExpenseCount,
      averageUtilizationPercent,
      categoryBreakdown,
      recentActivity,
      donations,
      expenses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
