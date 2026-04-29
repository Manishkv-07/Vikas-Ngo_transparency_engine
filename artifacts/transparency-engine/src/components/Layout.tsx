import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workspace/replit-auth-web";
import { ShieldCheck, LayoutDashboard, FolderKanban, Receipt, FileText, LogIn, LogOut } from "lucide-react";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/audit", label: "Audit log", icon: FileText },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-base">Vikas NGO</div>
              <div className="text-xs text-muted-foreground">Transparency engine</div>
            </div>
          </Link>
          <nav className="ml-4 hidden gap-1 md:flex">
            {navItems.map((item) => {
              const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAuthenticated && (
              <Link
                href="/admin"
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  location.startsWith("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
            ) : isAuthenticated ? (
              <>
                <div className="hidden text-right text-xs leading-tight md:block">
                  <div className="font-medium">
                    {user?.firstName ?? user?.email ?? "Member"}
                  </div>
                  <div className="text-muted-foreground">Signed in</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => login()}>
                <LogIn className="mr-2 h-4 w-4" /> Staff sign in
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Built for radical transparency. Every rupee accounted for.
      </footer>
    </div>
  );
}
