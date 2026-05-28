import express from 'express';
import { Expense } from '../models/Expense';
import { Project } from '../models/Project';

const router = express.Router();

// GET /api/expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ spentAt: -1 }).limit(50).lean();
    
    // Attach project info
    const expensesWithProject = await Promise.all(expenses.map(async (exp) => {
      const project = await Project.findOne({ id: exp.projectId }).lean();
      return {
        ...exp,
        projectName: project ? project.name : 'Unknown Project',
        projectSlug: project ? project.slug : 'unknown'
      };
    }));

    res.json(expensesWithProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/expenses/flagged
router.get('/flagged', async (req, res) => {
  try {
    const expenses = await Expense.find({ flagged: true }).sort({ spentAt: -1 }).lean();
    
    const expensesWithProject = await Promise.all(expenses.map(async (exp) => {
      const project = await Project.findOne({ id: exp.projectId }).lean();
      return {
        ...exp,
        projectName: project ? project.name : 'Unknown Project',
        projectSlug: project ? project.slug : 'unknown'
      };
    }));

    res.json(expensesWithProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
