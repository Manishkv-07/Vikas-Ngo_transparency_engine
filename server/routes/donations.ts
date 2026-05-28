import express from 'express';
import { Donation } from '../models/Donation';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/donations (Public)
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find().sort({ date: -1 }).limit(50).lean();
    res.json(donations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/donations (Protected)
router.post('/', requireAuth, async (req, res) => {
  try {
    const newDonation = new Donation({
      ...req.body,
    });
    await newDonation.save();
    res.status(201).json(newDonation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
