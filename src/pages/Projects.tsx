import { Link } from "wouter";
import { useListProjects } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Tag, Users } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function Projects() {
  const { data, isLoading } = useListProjects();
  const projects = data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">
          Every program we run, with its budget and live spending.
        </p>
      </header>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      )}

      {!isLoading && projects.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No projects published yet.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const util = Math.min(100, Math.max(0, p.utilizationPercent ?? 0));
          return (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full transition hover:border-primary/40 hover:shadow-md">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold leading-tight">{p.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {p.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Tag className="h-3 w-3" /> {p.category}
                        </span>
                      </div>
                    </div>
                    <Badge variant={p.status === "active" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </div>

                  <p className="line-clamp-3 text-sm text-muted-foreground">{p.description}</p>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{formatCurrency(p.totalSpent)}</span>
                      <span className="text-muted-foreground">{formatCurrency(p.budget)}</span>
                    </div>
                    <Progress value={util} className="mt-2 h-2" />
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{util.toFixed(0)}% used</span>
                      <span>{p.expenseCount} expenses</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" /> {formatNumber(p.beneficiaries)} beneficiaries
                    </span>
                    {p.flaggedCount > 0 && (
                      <Badge variant="destructive">{p.flaggedCount} flagged</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
