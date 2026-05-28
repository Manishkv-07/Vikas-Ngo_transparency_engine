import { useGetDonations } from "@/hooks/useDonations";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { HeartHandshake, Image as ImageIcon } from "lucide-react";

export default function Donations() {
  const donationsQ = useGetDonations();
  const summaryQ = useGetDashboardSummary({ query: { refetchInterval: 5000 } });

  const donations = donationsQ.data ?? [];
  const summary = summaryQ.data;

  const totalDonations = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const totalBudget = summary ? parseFloat(summary.totalBudget) : 0;
  const progressPercent = totalBudget > 0 ? (totalDonations / totalBudget) * 100 : 0;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <HeartHandshake className="h-10 w-10 text-primary" />
          Live Donations Feed
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Every contribution recorded and verified. See the real-time impact of our donors.
        </p>
      </header>

      {/* Funding Progress */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Overall Funding Progress</CardTitle>
          <CardDescription>Total donations received vs Total committed budget</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-bold text-primary">
                {donationsQ.isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalDonations)}
              </div>
              <div className="text-sm text-muted-foreground">Total Raised</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold">
                {summaryQ.isLoading ? <Skeleton className="h-6 w-24" /> : formatCurrency(totalBudget)}
              </div>
              <div className="text-sm text-muted-foreground">Total Goal</div>
            </div>
          </div>
          <Progress value={Math.min(100, progressPercent)} className="h-3 bg-primary/20" />
          <div className="text-sm text-right text-muted-foreground">
            {progressPercent.toFixed(1)}% Funded
          </div>
        </CardContent>
      </Card>

      {/* Donations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {donationsQ.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
        ) : donations.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center text-muted-foreground">
              No donations have been logged yet.
            </CardContent>
          </Card>
        ) : (
          donations.map((donation) => (
            <Card key={donation._id} className="overflow-hidden transition-all hover:shadow-md flex flex-col">
              {donation.proofPath ? (
                <div className="w-full h-48 bg-muted relative group">
                  <img 
                    src={donation.proofPath} 
                    alt={`Proof for donation by ${donation.donorName}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      Verified Proof
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 bg-muted/50 flex items-center justify-center text-muted-foreground border-b">
                  <div className="text-center space-y-2">
                    <ImageIcon className="h-8 w-8 mx-auto opacity-50" />
                    <div className="text-xs">No proof uploaded</div>
                  </div>
                </div>
              )}
              
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-lg truncate pr-2" title={donation.donorName}>
                      {donation.donorName}
                    </div>
                    <div className="font-mono font-bold text-primary whitespace-nowrap">
                      {formatCurrency(parseFloat(donation.amount))}
                    </div>
                  </div>
                  {donation.message && (
                    <p className="text-sm text-muted-foreground italic mb-4 line-clamp-3">
                      "{donation.message}"
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-4 flex items-center justify-between">
                  <span>{formatDateTime(donation.date)}</span>
                  {donation.projectId && <Badge variant="outline">Project #{donation.projectId}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
