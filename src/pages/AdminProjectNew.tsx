import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { slugify } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Education", "Healthcare", "Livelihoods", "Water & Sanitation", "Disaster Relief", "Environment"];

export default function AdminProjectNew() {
  const { isAuthenticated, login } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Education");
  const [location, setLocationField] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");

  const createMut = useCreateProject({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: "Project published", description: "Donors and beneficiaries can now see it." });
        setLocation("/admin");
      },
      onError: (e: Error) => {
        toast({ variant: "destructive", title: "Could not create project", description: e.message });
      },
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = slug.trim() || slugify(name);
    createMut.mutate({
      data: {
        name: name.trim(),
        slug: finalSlug,
        category,
        location: location.trim(),
        description: description.trim(),
        budget,
        beneficiaries: Number(beneficiaries) || 0,
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to admin
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Publish a new project</CardTitle>
          <CardDescription>This will be visible to the public immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(slugify(e.target.value));
                }}
                placeholder="Solar lights for Bagepalli"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="solar-bagepalli" />
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
              <Label htmlFor="location">Location</Label>
              <Input id="location" required value={location} onChange={(e) => setLocationField(e.target.value)} placeholder="Bagepalli, Karnataka" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this project does, who it serves, and the expected outcomes."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (INR)</Label>
                <Input id="budget" required type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="500000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaries">Beneficiaries</Label>
                <Input id="beneficiaries" required type="number" min="0" value={beneficiaries} onChange={(e) => setBeneficiaries(e.target.value)} placeholder="500" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createMut.isPending}>
              {createMut.isPending ? "Publishing…" : "Publish project"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
