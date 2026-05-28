import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp } from 'lucide-react';

interface LiveLedgerChartsProps {
  donations: any[];
  expenses: any[];
  totalBudget: number;
  totalSpent: number;
}

export function LiveLedgerCharts({ donations, expenses, totalBudget, totalSpent }: LiveLedgerChartsProps) {
  // 1. Real-Time "Pulse" Chart Data (Cumulative Donations vs Expenses over time)
  const pulseData = useMemo(() => {
    // We mock a timeline based on the dates of donations and expenses
    // In a real app, this would be an aggregation pipeline from MongoDB by month/week
    const timelineMap = new Map<string, { date: string, donations: number, expenses: number }>();
    
    // Process Donations
    donations.forEach(d => {
      const dateStr = new Date(d.date).toISOString().slice(0, 7); // YYYY-MM
      if (!timelineMap.has(dateStr)) timelineMap.set(dateStr, { date: dateStr, donations: 0, expenses: 0 });
      timelineMap.get(dateStr)!.donations += parseFloat(d.amount);
    });

    // Process Expenses
    expenses.forEach(e => {
      const dateStr = new Date(e.spentAt).toISOString().slice(0, 7);
      if (!timelineMap.has(dateStr)) timelineMap.set(dateStr, { date: dateStr, donations: 0, expenses: 0 });
      timelineMap.get(dateStr)!.expenses += parseFloat(e.amount);
    });

    return Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [donations, expenses]);

  // 2. Burn Rate Gauge
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  let burnStatus = "On Track";
  let burnColor = "text-green-500";
  if (utilization > 85) { burnStatus = "Critical"; burnColor = "text-red-500"; }
  else if (utilization > 60) { burnStatus = "Elevated"; burnColor = "text-yellow-500"; }

  // 3. Impact-per-Rupee Calculator
  // Mock impact: 1 textbook = ₹150
  const impactTextbooks = Math.floor(totalSpent / 150);
  // Mock impact: 1 meal = ₹50
  const impactMeals = Math.floor(totalSpent / 50);

  return (
    <div className="grid gap-6 md:grid-cols-3 mb-8">
      
      {/* Real-Time Pulse Chart */}
      <Card className="md:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Live Fund Pulse
              </CardTitle>
              <CardDescription>Real-time flow of incoming donations vs executed expenses</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Live Ledger Active
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pulseData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Area type="monotone" dataKey="donations" name="Incoming Donations" stroke="#10b981" fillOpacity={1} fill="url(#colorDonations)" />
                <Area type="monotone" dataKey="expenses" name="Executed Expenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Burn Rate Gauge */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" /> Burn Rate
            </CardTitle>
            <CardDescription>Current spending velocity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-muted">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${utilization * 2.89} 289`}
                  className={burnColor}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-2xl font-bold">{utilization.toFixed(1)}%</span>
              </div>
            </div>
            <div className={`mt-4 font-semibold ${burnColor}`}>{burnStatus}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Impact Calculator */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="md:col-span-2">
        <Card className="h-full bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" /> Live Social Impact
            </CardTitle>
            <CardDescription>What the executed expenses translate to in the real world</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-background p-4 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground">Textbooks Provided</div>
                <div className="mt-2 text-4xl font-bold text-primary">
                  {impactTextbooks.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Based on ₹150/unit</div>
              </div>
              <div className="rounded-lg bg-background p-4 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground">Meals Served</div>
                <div className="mt-2 text-4xl font-bold text-primary">
                  {impactMeals.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Based on ₹50/meal</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-center text-muted-foreground">
              These figures update instantly when staff log a new receipt to the ledger.
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
