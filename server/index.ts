import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { connectDB } from './db';
import { User } from './models/User';
import authRouter from './routes/auth';
import projectsRouter from './routes/projects';
import expensesRouter from './routes/expenses';
import donationsRouter from './routes/donations';
import dashboardRouter from './routes/dashboard';
import storageRouter from './routes/storage';
import healthRouter from './routes/health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      origin.startsWith('http://localhost:');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/healthz', healthRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/storage', storageRouter);

// Database and Server Start
connectDB().then(async () => {
  // Seed default admin user if not exists
  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'admin',
      passwordHash,
      role: 'admin'
    });
    console.log('Default admin user created: admin / password123');
  }

  // Seed Manish user if not exists
  const manishExists = await User.findOne({ username: 'Manish' });
  if (!manishExists) {
    const passwordHash = await bcrypt.hash('Ss1Mebb4eEr7y08t', 10);
    await User.create({
      username: 'Manish',
      passwordHash,
      role: 'admin'
    });
    console.log('User Manish created successfully with custom credentials.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
