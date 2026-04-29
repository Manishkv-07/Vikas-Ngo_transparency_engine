import { useListAuditLogs, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workspace/replit-auth-web";
import { ShieldAlert, LogIn } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default function Audit() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const auditQ = useListAuditLogs({
    query: { queryKey: getListAuditLogsQueryKey(), enabled: isAuthenticated },
  });

  if (authLoading) return <Skeleton className="h-64 w-full" />;
  if (!isAuthenticated) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="space-y-4 p-12">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <CardTitle>Audit log is staff-only</CardTitle>
          <CardDescription>
            Sign in with your Replit account to view every change made in the system.
          </CardDescription>
          <Button onClick={() => login()}>
            <LogIn className="mr-2 h-4 w-4" /> Sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  const logs = auditQ.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground">
          A tamper-evident record of every database change, by whom, with full context.
        </p>
      </header>

      {auditQ.isLoading && <Skeleton className="h-64 w-full" />}
      {!auditQ.isLoading && logs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </CardContent>
        </Card>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Most recent 200 events</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {logs.map((log) => (
                <li key={log.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {log.action.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{log.summary}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {log.entityType}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {log.userEmail ?? "system"} · {formatDateTime(log.createdAt)}
                    </div>
                    {Object.keys(log.metadata ?? {}).length > 0 && (
                      <pre className="mt-2 overflow-x-auto rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
