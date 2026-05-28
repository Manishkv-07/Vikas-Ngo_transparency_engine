import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  useCreateProjectExpense,
  useGetProject,
  getListProjectExpensesQueryKey,
  getGetProjectQueryKey,
  getGetDashboardSummaryQueryKey,
  getListExpensesQueryKey,
  getListFlaggedExpensesQueryKey,
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";

const CATEGORIES = [
  "Salaries",
  "Materials",
  "Travel",
  "Utilities",
  "Equipment",
  "Training",
  "Food",
  "Rent",
  "Professional services",
  "Other",
];

export default function AdminExpenseNew() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuth();
  const projectQ = useGetProject(projectId, {
    query: {
      queryKey: getGetProjectQueryKey(projectId),
      enabled: !Number.isNaN(projectId) && isAuthenticated,
    },
  });

  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("Materials");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);

  const upload = useUpload({
    onSuccess: (r) => {
      setReceiptPath(r.objectPath);
      toast({ title: "Receipt uploaded" });
    },
    onError: (e) => toast({ variant: "destructive", title: "Upload failed", description: e.message }),
  });

  const createMut = useCreateProjectExpense({
    mutation: {
      onSuccess: async (data) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListProjectExpensesQueryKey(projectId) }),
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }),
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListFlaggedExpensesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }),
        ]);
        if (data.flagged) {
          toast({
            variant: "destructive",
            title: `Flagged by AI auditor (risk ${data.riskScore})`,
            description: data.riskReasoning ?? "Review the entry on the project page.",
          });
        } else {
          toast({
            title: "Expense logged",
            description: `AI risk score: ${data.riskScore}/100`,
          });
        }
        setLocation(`/projects/${projectId}`);
      },
      onError: (e: Error) =>
        toast({ variant: "destructive", title: "Could not log expense", description: e.message }),
    },
  });

  if (!isAuthenticated) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <CardContent className="space-y-3 p-12">
          <CardTitle>Sign in required</CardTitle>
          <Button onClick={() => login()}>Sign in</Button>
        </CardContent>
      </Card>
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptName(file.name);
    await upload.uploadFile(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMut.mutate({
      id: projectId,
      data: {
        vendor: vendor.trim(),
        category,
        description: description.trim(),
        amount,
        receiptPath,
        spentAt: new Date(spentAt).toISOString(),
      },
    });
  }

  const project = projectQ.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to admin
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Log a new expense</CardTitle>
          <CardDescription>
            {project ? (
              <>For <span className="font-medium text-foreground">{project.name}</span> · {formatCurrency(project.remaining)} remaining</>
            ) : (
              "An AI auditor will score this entry for risk."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor / payee</Label>
                <Input id="vendor" required value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Acme Hardware" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">What was this for?</Label>
              <Textarea
                id="description"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="50 LED bulbs and wiring for community hall installation"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input id="amount" required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spentAt">Date</Label>
                <Input id="spentAt" required type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Receipt (optional)</Label>
              <div className="flex items-center gap-3 rounded-md border border-dashed p-4">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input type="file" onChange={handleFileChange} className="text-sm" disabled={upload.isUploading} />
                {upload.isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {receiptPath && (
                  <span className="text-xs text-muted-foreground">Uploaded: {receiptName}</span>
                )}
              </div>
            </div>

            <div className="rounded-md border bg-primary/5 p-3 text-xs text-muted-foreground">
              <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
              When you submit, an AI auditor will review the amount against the project's remaining
              budget, recent vendors, and the description — and assign a public risk score.
            </div>

            <Button type="submit" className="w-full" disabled={createMut.isPending || upload.isUploading}>
              {createMut.isPending ? "Submitting for AI review…" : "Submit expense"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
