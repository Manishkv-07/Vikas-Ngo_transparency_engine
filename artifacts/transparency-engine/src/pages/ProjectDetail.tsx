import { Link, useParams } from "wouter";
import {
  useGetProject,
  useListProjectExpenses,
  getGetProjectQueryKey,
  getListProjectExpensesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Tag, Users, Receipt, FileSearch } from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useAuth } from "@workspace/replit-auth-web";

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const projectQ = useGetProject(id, {
    query: { queryKey: getGetProjectQueryKey(id), enabled: !Number.isNaN(id) },
  });
  const expensesQ = useListProjectExpenses(id, {
    query: { queryKey: getListProjectExpensesQueryKey(id), enabled: !Number.isNaN(id) },
  });
  const { isAuthenticated } = useAuth();

  if (projectQ.isLoading) return <Skeleton className="h-96 w-full" />;
  if (projectQ.isError || !projectQ.data) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Project not found.{" "}
        <Link href="/projects" className="text-primary underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const p = projectQ.data;
  const util = Math.min(100, Math.max(0, p.utilizationPercent ?? 0));
  const expenses = expensesQ.data ?? [];

  return (
    <div className="space-y-8">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{p.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {p.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Tag className="h-4 w-4" /> {p.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" /> {formatNumber(p.beneficiaries)} beneficiaries
              </span>
              <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
            </div>
          </div>
          {isAuthenticated && (
            <Link href={`/admin/projects/${p.id}/expenses/new`}>
              <Button>
                <Receipt className="mr-2 h-4 w-4" /> Log expense
              </Button>
            </Link>
          )}
        </div>
        <p className="max-w-3xl text-muted-foreground">{p.description}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="Budget" value={formatCurrency(p.budget)} hint={`Started ${formatDate(p.startDate)}`} />
        <Stat label="Spent" value={formatCurrency(p.totalSpent)} hint={`${util.toFixed(0)}% utilized`} />
        <Stat
          label="Remaining"
          value={formatCurrency(p.remaining)}
          hint={`${p.expenseCount} expenses · ${p.flaggedCount} flagged`}
          tone={Number(p.remaining) < 0 ? "warn" : "default"}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Budget utilization</CardTitle>
          <CardDescription>How much of the committed budget has been disbursed</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={util} className="h-3" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(p.totalSpent)} spent</span>
            <span>{formatCurrency(p.budget)} budget</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense ledger</CardTitle>
          <CardDescription>Every line item, with AI risk score</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesQ.isLoading && <Skeleton className="h-48 w-full" />}
          {!expensesQ.isLoading && expenses.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No expenses logged yet.
            </div>
          )}
          {expenses.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-medium">Date</th>
                    <th className="py-2 text-left font-medium">Vendor</th>
                    <th className="py-2 text-left font-medium">Category</th>
                    <th className="py-2 text-left font-medium">Description</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                    <th className="py-2 text-center font-medium">Risk</th>
                    <th className="py-2 text-center font-medium">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-3 text-muted-foreground">{formatDate(e.spentAt)}</td>
                      <td className="py-3 font-medium">{e.vendor}</td>
                      <td className="py-3 text-muted-foreground">{e.category}</td>
                      <td className="py-3">
                        <div className="max-w-xs truncate" title={e.description}>
                          {e.description}
                        </div>
                        {e.riskFlags && e.riskFlags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {e.riskFlags.map((f) => (
                              <Badge key={f} variant="outline" className="text-[10px]">
                                {f.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono">{formatCurrency(e.amount)}</td>
                      <td className="py-3 text-center">
                        <RiskBadge score={e.riskScore} flagged={e.flagged} />
                      </td>
                      <td className="py-3 text-center">
                        {e.receiptPath ? (
                          <a
                            href={`/api/storage${e.receiptPath.replace(/^\/?/, "/")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-primary hover:underline"
                          >
                            <FileSearch className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "warn";
}) {
  return (
    <Card className={tone === "warn" ? "border-amber-300" : undefined}>
      <CardContent className="space-y-1 p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

function RiskBadge({ score, flagged }: { score: number; flagged: boolean }) {
  if (flagged || score >= 60) return <Badge variant="destructive">{score}</Badge>;
  if (score >= 26)
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{score}</Badge>
    );
  return <Badge variant="secondary">{score}</Badge>;
}
