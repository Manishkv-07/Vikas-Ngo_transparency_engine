import { Link } from "wouter";
import { useListExpenses, useListFlaggedExpenses } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { MapPin } from "lucide-react";

export default function Expenses() {
  const all = useListExpenses();
  const flagged = useListFlaggedExpenses();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Live expense feed</h1>
        <p className="text-muted-foreground">
          Every payment we make, scored by an AI auditor.
        </p>
      </header>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({all.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged ({flagged.data?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <ExpenseTable data={all.data ?? []} loading={all.isLoading} />
        </TabsContent>
        <TabsContent value="flagged" className="mt-4">
          <ExpenseTable data={flagged.data ?? []} loading={flagged.isLoading} flaggedOnly />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ExpenseRow {
  id: number;
  projectId: number;
  projectName: string;
  vendor: string;
  category: string;
  description: string;
  amount: string;
  riskScore: number;
  riskFlags: string[];
  flagged: boolean;
  spentAt: string;
}

function ExpenseTable({
  data,
  loading,
  flaggedOnly,
}: {
  data: ExpenseRow[];
  loading: boolean;
  flaggedOnly?: boolean;
}) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-sm text-muted-foreground">
          {flaggedOnly
            ? "No flagged expenses. The auditor is happy."
            : "No expenses logged yet."}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest 100 entries</CardTitle>
        <CardDescription>Click a row to open the project ledger.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 text-left font-medium">Date</th>
                <th className="py-2 text-left font-medium">Project</th>
                <th className="py-2 text-left font-medium">Vendor</th>
                <th className="py-2 text-left font-medium">Description</th>
                <th className="py-2 text-right font-medium">Amount</th>
                <th className="py-2 text-center font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="py-3 text-muted-foreground">{formatDate(e.spentAt)}</td>
                  <td className="py-3">
                    <Link
                      href={`/projects/${e.projectId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {e.projectName}
                    </Link>
                  </td>
                  <td className="py-3">
                    <div className="font-medium">{e.vendor}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <MapPin className="mr-1 h-3 w-3" />
                      {/* Mocked GPS coordinates based on project name hash or random for demo */}
                      {Math.abs((e.projectName.charCodeAt(0) * 12.34) % 90).toFixed(4)}°N, {Math.abs((e.projectName.length * 45.67) % 180).toFixed(4)}°E
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="max-w-xs truncate text-muted-foreground" title={e.description}>
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
                    {e.flagged || e.riskScore >= 60 ? (
                      <Badge variant="destructive">{e.riskScore}</Badge>
                    ) : e.riskScore >= 26 ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        {e.riskScore}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{e.riskScore}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
