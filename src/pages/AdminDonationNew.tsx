import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUpload } from "@workspace/object-storage-web";
import { useAuth } from "@workspace/replit-auth-web";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Loader2, HeartHandshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateDonation } from "@/hooks/useDonations";

export default function AdminDonationNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuth();
  
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);

  const upload = useUpload({
    onSuccess: (r) => {
      setProofPath(r.objectPath);
      toast({ title: "Proof uploaded securely to GridFS" });
    },
    onError: (e) => toast({ variant: "destructive", title: "Upload failed", description: e.message }),
  });

  const createMut = useCreateDonation();

  if (!isAuthenticated) {
    return (
      <Card className="mx-auto max-w-lg text-center mt-10">
        <CardContent className="space-y-3 p-12">
          <CardTitle>Sign in required</CardTitle>
          <Button onClick={() => login()}>Sign in to log donations</Button>
        </CardContent>
      </Card>
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofName(file.name);
    await upload.uploadFile(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMut.mutate({
      donorName: donorName.trim(),
      amount,
      message: message.trim(),
      date: new Date(date).toISOString(),
      proofPath: proofPath || undefined,
    }, {
      onSuccess: () => {
        toast({ title: "Donation tracked successfully!" });
        setLocation("/admin");
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Failed to log donation", description: err.message });
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to admin
      </Link>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <HeartHandshake className="h-6 w-6 text-primary" />
            <CardTitle>Log Incoming Donation</CardTitle>
          </div>
          <CardDescription>
            Record funds received and upload proof (bank receipt, cheque image, etc.) into the live ledger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="donorName">Donor Name</Label>
                <Input id="donorName" required value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="John Doe or Anonymous" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input id="amount" required type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date Received</Label>
              <Input id="date" required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message / Notes (optional)</Label>
              <Textarea
                id="message"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Donation towards rural education"
              />
            </div>

            <div className="space-y-2">
              <Label>Proof of Donation (Receipt/Cheque image)</Label>
              <div className="flex items-center gap-3 rounded-md border border-dashed p-4 bg-muted/20">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input type="file" onChange={handleFileChange} className="text-sm" disabled={upload.isUploading} />
                {upload.isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {proofPath && (
                  <span className="text-xs text-primary font-medium">Uploaded: {proofName}</span>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={createMut.isPending || upload.isUploading}>
              {createMut.isPending ? "Logging to ledger..." : "Confirm Donation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
