import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useListFlaggedExpenses,
  useListProjects,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  CircleDollarSign,
  AlertTriangle,
  Users,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { LiveLedgerCharts } from "@/components/LiveLedgerCharts";

export default function Home() {
  const summaryQ = useGetDashboardSummary({ query: { refetchInterval: 5000 } });
  const projectsQ = useListProjects({ query: { refetchInterval: 10000 } });
  const flaggedQ = useListFlaggedExpenses({ query: { refetchInterval: 10000 } });

  const summary = summaryQ.data;
  const projects = projectsQ.data ?? [];
  const flagged = flaggedQ.data ?? [];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xs p-8 md:p-12">
        <div className="max-w-2xl space-y-4">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" /> AI-monitored expenses
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Every rupee, on the public record.
          </h1>
          <p className="text-lg text-muted-foreground">
            We publish our budgets, expenses and receipts in real time. An AI auditor reviews every
            entry and flags anything that looks off — so donors and beneficiaries always know where
            their money went.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/donations">
              <Button size="lg">
                View all donations <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="secondary">
                Browse projects
              </Button>
            </Link>
            <Link href="/expenses">
              <Button size="lg" variant="outline">
                See live expenses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {summary && (
        <LiveLedgerCharts 
          donations={summary.donations || []} 
          expenses={summary.expenses || []} 
          totalBudget={parseFloat(summary.totalBudget || "0")} 
          totalSpent={parseFloat(summary.totalSpent || "0")} 
        />
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total committed budget"
          value={summary ? formatCurrency(summary.totalBudget) : null}
          hint={`across ${summary?.totalProjects ?? 0} projects`}
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <StatCard
          label="Funds disbursed"
          value={summary ? formatCurrency(summary.totalSpent) : null}
          hint={`${summary?.averageUtilizationPercent ?? 0}% avg utilization`}
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Lives touched"
          value={summary ? formatNumber(summary.totalBeneficiaries) : null}
          hint="direct beneficiaries"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Flagged expenses"
          value={summary ? String(summary.flaggedExpenseCount) : null}
          hint="reviewed by AI auditor"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone={summary && summary.flaggedExpenseCount > 0 ? "warn" : "default"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active projects</CardTitle>
              <CardDescription>Real-time budget utilization</CardDescription>
            </div>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsQ.isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            {!projectsQ.isLoading && projects.length === 0 && (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No projects published yet. Sign in as staff to add the first one.
              </div>
            )}
            {projects.slice(0, 5).map((p) => {
              const util = Math.min(100, Math.max(0, p.utilizationPercent ?? 0));
              return (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <div className="group rounded-lg border p-4 transition hover:border-primary/40 hover:bg-accent/40">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.location} · {p.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(p.totalSpent)}{" "}
                          <span className="text-muted-foreground">
                            / {formatCurrency(p.budget)}
                          </span>
                        </div>
                        {p.flaggedCount > 0 && (
                          <Badge variant="destructive" className="mt-1">
                            {p.flaggedCount} flagged
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={util} className="mt-3 h-2" />
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{util.toFixed(0)}% utilized</span>
                      <span>{p.expenseCount} expenses logged</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              AI audit alerts
            </CardTitle>
            <CardDescription>Expenses worth a closer look</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {flaggedQ.isLoading && <Skeleton className="h-32 w-full" />}
            {!flaggedQ.isLoading && flagged.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nothing flagged. All expenses look clean.
              </div>
            )}
            {flagged.slice(0, 5).map((e) => (
              <Link key={e.id} href={`/projects/${e.projectId}`}>
                <div className="rounded-lg border p-3 transition hover:border-primary/40 hover:bg-accent/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium">{e.vendor}</div>
                    <Badge variant="destructive">{e.riskScore}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.projectName} · {formatCurrency(e.amount)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(e.riskFlags ?? []).slice(0, 3).map((f) => (
                      <Badge key={f} variant="outline" className="text-xs">
                        {f.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      {summary && summary.categoryBreakdown.length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Where the money goes</CardTitle>
              <CardDescription>Spending by category, all projects combined</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {summary.categoryBreakdown.map((c) => (
                  <div key={c.category} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium capitalize">{c.category}</div>
                      <Badge variant="secondary">{c.count}</Badge>
                    </div>
                    <div className="mt-1 text-xl font-semibold">
                      {formatCurrency(c.spent)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {summary && summary.recentActivity.length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Latest activity</CardTitle>
              <CardDescription>Public log of every change</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {summary.recentActivity.slice(0, 6).map((log) => (
                  <li key={log.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="text-sm">{log.summary}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.userEmail ?? "system"} · {formatDateTime(log.createdAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | null;
  hint: string;
  icon: React.ReactNode;
  tone?: "default" | "warn";
}) {
  return (
    <Card className={tone === "warn" ? "border-amber-300/60" : undefined}>
      <CardContent className="space-y-2 p-5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs uppercase tracking-wide">{label}</span>
          <span
            className={`grid h-8 w-8 place-items-center rounded-md ${
              tone === "warn" ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
            }`}
          >
            {icon}
          </span>
        </div>
        <div className="text-3xl font-semibold tracking-tight">
          {value ?? <Skeleton className="h-8 w-24" />}
        </div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
