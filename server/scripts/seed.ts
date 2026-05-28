import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { Project } from '../models/Project';
import { Donation } from '../models/Donation';
import { Expense } from '../models/Expense';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ngo-transparency';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Clear collections
    console.log('Clearing existing data...');
    await Project.deleteMany({});
    await Donation.deleteMany({});
    await Expense.deleteMany({});
    await AuditLog.deleteMany({});
    await User.deleteMany({});

    // Seed Admin users
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminUser = await User.create({
      username: 'admin',
      passwordHash,
      role: 'admin'
    });
    
    const manishPasswordHash = await bcrypt.hash('Ss1Mebb4eEr7y08t', 10);
    const manishUser = await User.create({
      username: 'Manish',
      passwordHash: manishPasswordHash,
      role: 'admin'
    });
    console.log('Admin users seeded (admin and Manish).');

    // Seed Projects
    console.log('Seeding projects...');
    const projectsData = [
      {
        id: 1,
        name: 'Solar Lights for Bagepalli',
        slug: 'solar-lights-for-bagepalli',
        category: 'Infrastructure',
        location: 'Bagepalli, Karnataka',
        description: 'Providing reliable solar street lighting and household light kits to 1,200 rural families in Bagepalli block.',
        budget: '1000000',
        beneficiaries: 1200,
        status: 'active',
        startDate: new Date('2026-01-10'),
      },
      {
        id: 2,
        name: 'Manglore Healthcare Expansion',
        slug: 'manglore-healthcare-expansion',
        category: 'Healthcare',
        location: 'Mangalore, Karnataka',
        description: 'Expanding rural clinic capacities, adding modern diagnosis kits, and scaling up the mobile health van service.',
        budget: '750000',
        beneficiaries: 2500,
        status: 'active',
        startDate: new Date('2026-02-15'),
      },
      {
        id: 3,
        name: 'Clean Water Initiative',
        slug: 'clean-water-initiative',
        category: 'Sanitation',
        location: 'Kolar, Karnataka',
        description: 'Installing 5 high-capacity reverse osmosis water purification plants in villages facing heavy fluoride contamination.',
        budget: '500000',
        beneficiaries: 800,
        status: 'active',
        startDate: new Date('2026-03-01'),
      }
    ];

    const seededProjects = await Project.insertMany(projectsData);
    console.log(`Seeded ${seededProjects.length} projects.`);

    // Seed Donations (20 donations totaling exactly ₹20,00,000)
    console.log('Seeding donations...');
    const targetTotal = 2000000;
    let currentTotal = 0;
    const donationsData = [];

    for (let i = 0; i < 19; i++) {
      // Amount between ₹60,000 and ₹1,30,000
      const amount = Math.floor(faker.number.int({ min: 60000, max: 130000 }));
      currentTotal += amount;
      
      const randomDate = faker.date.between({ from: '2026-01-15', to: '2026-05-25' });
      const projId = faker.number.int({ min: 1, max: 3 });

      donationsData.push({
        donorName: faker.person.fullName(),
        amount: amount.toString(),
        date: randomDate,
        projectId: projId,
        message: faker.helpers.arrayElement([
          'Keep up the great work!',
          'Happy to support this initiative.',
          'Hope this helps the communities.',
          'In honor of my parents.',
          'Making the world a better place, one rupee at a time.',
          null
        ])
      });
    }

    // 20th donation gets the remainder to make the total exactly ₹20,00,000
    const finalAmount = targetTotal - currentTotal;
    donationsData.push({
      donorName: faker.person.fullName(),
      amount: finalAmount.toString(),
      date: faker.date.between({ from: '2026-05-01', to: '2026-05-25' }),
      projectId: faker.number.int({ min: 1, max: 3 }),
      message: 'Final seed donation'
    });

    const seededDonations = await Donation.insertMany(donationsData);
    console.log(`Seeded ${seededDonations.length} donations totaling ₹${targetTotal.toLocaleString()}.`);

    // Seed Expenses (30 expenses)
    console.log('Seeding expenses...');
    const expensesData = [];
    const auditLogsData = [];

    const categories = ['Equipment', 'Logistics', 'Supplies'];
    
    for (let i = 1; i <= 30; i++) {
      const projId = faker.number.int({ min: 1, max: 3 });
      const category = faker.helpers.arrayElement(categories);
      const amount = Math.floor(faker.number.int({ min: 5000, max: 45000 }));
      const riskScore = faker.number.int({ min: 5, max: 95 });
      const flagged = riskScore >= 60;

      let riskFlags: string[] = [];
      let riskReasoning = '';
      if (flagged) {
        riskFlags = faker.helpers.arrayElements([
          'high_cost_variance',
          'suspicious_vendor',
          'irregular_receipt_format',
          'weekend_transaction'
        ], { min: 1, max: 3 });
        riskReasoning = `AI flag generated due to: ${riskFlags.join(', ').replace(/_/g, ' ')}. Transaction requires administrative review.`;
      }

      const spentAtDate = faker.date.between({ from: '2026-01-20', to: '2026-05-27' });
      const vendorName = `${faker.company.name()} ${faker.helpers.arrayElement(['Ltd', 'Enterprises', 'Suppliers', 'Logistics'])}`;

      expensesData.push({
        id: i,
        projectId: projId,
        vendor: vendorName,
        category,
        description: faker.commerce.productDescription(),
        amount: amount.toString(),
        receiptPath: 'https://picsum.photos/400/600',
        riskScore,
        riskFlags,
        riskReasoning,
        flagged,
        spentAt: spentAtDate,
        createdBy: 'Manish'
      });

      // Audit Log entry for the expense
      auditLogsData.push({
        id: i,
        action: 'EXPENSE_LOGGED',
        entityType: 'Expense',
        entityId: i,
        userId: manishUser._id.toString(),
        userEmail: 'manish@vikasngo.org',
        summary: `Expense of ₹${amount.toLocaleString()} logged for ${category} under Project #${projId} from vendor ${vendorName}`,
        metadata: { expenseId: i, amount, vendor: vendorName },
        createdAt: spentAtDate
      });
    }

    const seededExpenses = await Expense.insertMany(expensesData);
    const seededAuditLogs = await AuditLog.insertMany(auditLogsData);
    
    console.log(`Seeded ${seededExpenses.length} expenses.`);
    console.log(`Seeded ${seededAuditLogs.length} audit logs.`);

    console.log('Database seeding successfully completed!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
