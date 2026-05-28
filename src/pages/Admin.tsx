import { Link } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useListProjects, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, LogIn, Plus, Receipt, HeartHandshake } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default function Admin() {
  const { isAuthenticated, isLoading, login, user } = useAuth();
  const projectsQ = useListProjects({
    query: { queryKey: getListProjectsQueryKey(), enabled: isAuthenticated },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!isAuthenticated) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="space-y-4 p-12">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <CardTitle>Staff sign-in required</CardTitle>
          <CardDescription>
            Only NGO staff can publish projects and log expenses. Sign in with your Replit account
            to continue.
          </CardDescription>
          <Button onClick={() => login()}>
            <LogIn className="mr-2 h-4 w-4" /> Sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  const projects = projectsQ.data ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin console</h1>
          <p className="text-muted-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. Every action you take here
            is logged to the public audit feed.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/donations/new">
            <Button variant="secondary">
              <HeartHandshake className="mr-2 h-4 w-4" /> Log donation
            </Button>
          </Link>
          <Link href="/admin/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New project
            </Button>
          </Link>
        </div>
      </header>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-12 text-center">
            <CardTitle>Publish your first project</CardTitle>
            <CardDescription>
              Add a project with budget, location and beneficiaries. Then start logging expenses.
            </CardDescription>
            <Link href="/admin/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your projects</CardTitle>
            <CardDescription>Click "Log expense" to add a new line item.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {projects.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(p.totalSpent)} of {formatCurrency(p.budget)} ·{" "}
                    {p.expenseCount} expenses
                    {p.flaggedCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {p.flaggedCount} flagged
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/projects/${p.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link href={`/admin/projects/${p.id}/expenses/new`}>
                    <Button size="sm">
                      <Receipt className="mr-2 h-4 w-4" /> Log expense
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
