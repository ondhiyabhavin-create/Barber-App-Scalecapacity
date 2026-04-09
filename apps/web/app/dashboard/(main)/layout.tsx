import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/profile";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-nav";
import { DashboardBottomNav } from "@/components/dashboard/dashboard-bottom-nav";
import { Badge } from "@/components/ui/badge";

export default async function MainDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, tenant } = await getSessionProfile();
  const role = profile?.role;

  if (!profile?.tenant_id) {
    redirect("/dashboard/onboarding");
  }

  if (!tenant?.onboarding_completed) {
    redirect("/dashboard/onboarding");
  }

  const devRoleSwitcherOn =
    process.env.NEXT_PUBLIC_ENABLE_DEV_ROLE_SWITCHER === "true" ||
    (process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_ENABLE_DEV_ROLE_SWITCHER !== "false");

  return (
    <div className="app-page flex min-h-screen">
      <div className="pointer-events-none absolute inset-0 app-grid opacity-[0.25] dark:opacity-[0.2]" />
      <aside className="glass-strong relative z-10 hidden w-64 flex-col border-r border-border/50 bg-card/35 p-4 backdrop-blur-xl md:flex">
        <div className="mb-8 px-2">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/15 text-primary ring-1 ring-primary/20">
              <Sparkles className="size-4" />
            </span>
            BarberOS
          </Link>
          <p className="mt-2 truncate pl-[2.75rem] text-xs text-muted-foreground">
            {tenant?.name}
          </p>
          {role ? (
            <div className="mt-2 pl-[2.75rem]">
              <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wide">
                {role}
              </Badge>
            </div>
          ) : null}
        </div>
        <DashboardSidebarNav role={role} />
        <div className="mt-auto space-y-2 border-t border-border/50 pt-4">
          {tenant?.slug ? (
            <Link
              href={`/book/${tenant.slug}`}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex w-full justify-center rounded-xl border-border/70"
              )}
            >
              Open booking page
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </aside>
      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <header className="glass-panel space-y-3 border-b border-border/50 px-4 py-3 backdrop-blur-md md:px-8">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-heading text-base font-semibold md:hidden"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="size-4" />
              </span>
              BarberOS
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <ModeToggle />
            </div>
          </div>
        </header>
        <main
          className={cn(
            "app-content-max relative flex-1 px-4 py-6 md:px-8 md:pb-6",
            devRoleSwitcherOn
              ? "pb-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom,0px)+3.5rem)]"
              : "pb-app-bottom-nav"
          )}
        >
          {children}
        </main>
        <DashboardBottomNav role={role} tenantSlug={tenant?.slug ?? null} />
      </div>
    </div>
  );
}
