import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, LayoutDashboard, Megaphone, Settings, Users } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/profile";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function MainDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, tenant } = await getSessionProfile();

  if (!profile?.tenant_id) {
    redirect("/dashboard/onboarding");
  }

  if (!tenant?.onboarding_completed) {
    redirect("/dashboard/onboarding");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="glass-panel hidden w-64 flex-col border-r border-border/60 bg-card/40 p-4 backdrop-blur-xl md:flex">
        <div className="mb-8 px-2">
          <p className="font-heading text-lg font-semibold">BarberOS</p>
          <p className="truncate text-xs text-muted-foreground">{tenant?.name}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t border-border/60 pt-4">
          {tenant?.slug ? (
            <Link
              href={`/book/${tenant.slug}`}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex w-full justify-center"
              )}
            >
              Open booking page
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="space-y-3 border-b border-border/60 px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading text-base font-semibold md:hidden">BarberOS</p>
            <div className="ml-auto flex items-center gap-2">
              <ModeToggle />
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground"
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
