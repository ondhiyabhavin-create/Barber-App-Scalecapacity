"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Megaphone, Scissors, Settings, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type DashboardRole = "owner" | "staff" | "client";

const allNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["owner", "staff", "client"] as const },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays, roles: ["owner", "staff", "client"] as const },
  { href: "/dashboard/clients", label: "Clients", icon: Users, roles: ["owner", "staff"] as const },
  { href: "/dashboard/services", label: "Services", icon: Scissors, roles: ["owner", "staff"] as const },
  { href: "/dashboard/shops", label: "Shops", icon: Store, roles: ["owner"] as const },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone, roles: ["owner", "staff"] as const },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["owner"] as const },
];

function navItemsForRole(role: DashboardRole | undefined) {
  const r = role ?? "owner";
  return allNav.filter((item) => (item.roles as readonly string[]).includes(r));
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavProps = { role?: DashboardRole };

export function DashboardSidebarNav({ role }: NavProps) {
  const pathname = usePathname();
  const nav = navItemsForRole(role);

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        const isDisabled = item.href === "/dashboard/marketing";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition interactive",
              active
                ? "bg-primary/12 font-medium text-primary ring-1 ring-primary/20"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
            {isDisabled ? (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Soon
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardMobileNav({ role }: NavProps) {
  const pathname = usePathname();
  const nav = navItemsForRole(role);

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
              active
                ? "border-primary/40 bg-primary/10 font-medium text-primary"
                : "border-border/60 bg-card/50 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
