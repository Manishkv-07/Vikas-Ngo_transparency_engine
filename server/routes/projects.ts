import express from 'express';
import { Project } from '../models/Project';
import { Expense } from '../models/Expense';
import { AuditLog } from '../models/AuditLog';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().lean();
    
    // Add summary fields for each project
    const projectsWithSummary = await Promise.all(projects.map(async (p) => {
      const expenses = await Expense.find({ projectId: p.id }).lean();
      const totalSpentNum = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const budgetNum = parseFloat(p.budget);
      const remainingNum = budgetNum - totalSpentNum;
      
      const flaggedCount = expenses.filter(exp => exp.flagged).length;
      const utilizationPercent = budgetNum > 0 ? (totalSpentNum / budgetNum) * 100 : 0;

      return {
        ...p,
        totalSpent: totalSpentNum.toString(),
        remaining: remainingNum.toString(),
        expenseCount: expenses.length,
        flaggedCount,
        utilizationPercent
      };
    }));

    res.json(projectsWithSummary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/projects
router.post('/', requireAuth, async (req, res) => {
  try {
    const nextId = (await Project.countDocuments()) + 1;
    const newProject = new Project({
      ...req.body,
      id: nextId,
    });
    await newProject.save();

    await new AuditLog({
      id: Date.now(),
      action: 'CREATE',
      entityType: 'Project',
      entityId: nextId,
      summary: `Created new project: ${req.body.name}`,
    }).save();

    res.status(201).json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await Project.findOne({ id: projectId }).lean();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const expenses = await Expense.find({ projectId }).sort({ spentAt: -1 }).limit(10).lean();
    
    const totalSpentNum = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const budgetNum = parseFloat(project.budget);
    const remainingNum = budgetNum - totalSpentNum;
    
    const flaggedCount = expenses.filter(exp => exp.flagged).length;
    const utilizationPercent = budgetNum > 0 ? (totalSpentNum / budgetNum) * 100 : 0;

    // Calculate Transparency Score (Gamification)
    // Score starts at 100.
    // Penalty for expenses without receipts (-10 per missing receipt).
    // Penalty for late uploads (if spentAt is far from createdAt) (-5 per late receipt).
    let transparencyScore = 100;
    let missingReceipts = 0;
    for (const exp of expenses) {
      if (!exp.receiptPath) {
        missingReceipts++;
        transparencyScore -= 10;
      }
      if (exp.createdAt && exp.spentAt) {
        const diffDays = (new Date(exp.createdAt).getTime() - new Date(exp.spentAt).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) transparencyScore -= 5;
      }
    }
    transparencyScore = Math.max(0, transparencyScore); // Minimum score 0

    const projectDetail = {
      ...project,
      totalSpent: totalSpentNum.toString(),
      remaining: remainingNum.toString(),
      expenseCount: expenses.length,
      flaggedCount,
      utilizationPercent,
      transparencyScore,
      missingReceipts,
      recentExpenses: expenses
    };

    res.json(projectDetail);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/projects/:id/expenses
router.get('/:id/expenses', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const expenses = await Expense.find({ projectId }).sort({ spentAt: -1 }).lean();
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/projects/:id/expenses
router.post('/:id/expenses', requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const nextId = (await Expense.countDocuments()) + 1;
    
    // Enhanced Auto-flagging logic for risk (Mock AI Auditor)
    const amount = parseFloat(req.body.amount);
    let riskScore = 10;
    let flagged = false;
    let riskFlags: string[] = [];

    // Project context
    const project = await Project.findOne({ id: projectId }).lean();
    const budgetNum = project ? parseFloat(project.budget) : 1000000;

    if (amount > budgetNum * 0.3) {
      riskScore += 40;
      flagged = true;
      riskFlags.push('Exceeds 30% of total project budget');
    }

    if (amount > 100000) {
      riskScore += 35;
      flagged = true;
      riskFlags.push('High value transaction');
    }

    // Time-based anomaly
    const spentDate = new Date(req.body.spentAt);
    const hour = spentDate.getHours();
    if (hour >= 0 && hour <= 4) {
      riskScore += 25;
      flagged = true;
      riskFlags.push(`Suspicious time: transaction logged at ${hour}:00 AM`);
    }

    // Keyword anomaly
    const descriptionLower = (req.body.description || '').toLowerCase();
    if (descriptionLower.includes('electronics') || descriptionLower.includes('luxury') || descriptionLower.includes('entertainment')) {
      riskScore += 20;
      if (amount > 10000) {
        flagged = true;
        riskFlags.push(`Suspicious category keyword combined with high amount`);
      }
    }

    if (!req.body.receiptPath) {
      riskScore += 20;
      flagged = true;
      riskFlags.push('Missing receipt');
    }

    riskScore = Math.min(100, riskScore);

    const newExpense = new Expense({
      ...req.body,
      id: nextId,
      projectId,
      riskScore,
      riskFlags,
      flagged
    });
    await newExpense.save();

    await new AuditLog({
      id: Date.now(),
      action: 'CREATE',
      entityType: 'Expense',
      entityId: nextId,
      summary: `Logged expense of ${req.body.amount} to ${req.body.vendor}`,
    }).save();

    res.status(201).json(newExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
