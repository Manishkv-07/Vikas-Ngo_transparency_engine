import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Donation {
  _id: string;
  donorName: string;
  amount: string;
  date: string;
  proofPath?: string;
  projectId?: number;
  message?: string;
  createdAt: string;
}

export function useGetDonations() {
  return useQuery<Donation[]>({
    queryKey: ["donations"],
    queryFn: async () => {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiBase}/api/donations`);
      if (!res.ok) throw new Error("Failed to fetch donations");
      return res.json();
    },
  });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Donation>) => {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiBase}/api/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log donation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations"] });
    },
  });
}
