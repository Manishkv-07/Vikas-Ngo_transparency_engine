import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Expenses from "@/pages/Expenses";
import Audit from "@/pages/Audit";
import Admin from "@/pages/Admin";
import Donations from "@/pages/Donations";
import AdminProjectNew from "@/pages/AdminProjectNew";
import AdminExpenseNew from "@/pages/AdminExpenseNew";
import AdminDonationNew from "@/pages/AdminDonationNew";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/donations" component={Donations} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/audit" component={Audit} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/projects/new" component={AdminProjectNew} />
      <Route path="/admin/projects/:id/expenses/new" component={AdminExpenseNew} />
      <Route path="/admin/donations/new" component={AdminDonationNew} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
