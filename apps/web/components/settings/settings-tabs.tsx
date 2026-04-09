"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs: { href: string; label: string; exact?: boolean }[] = [
  { href: "/dashboard/settings", label: "Workspace", exact: true },
  { href: "/dashboard/settings/services", label: "Services" },
  { href: "/dashboard/settings/team", label: "Team & sign-ups" },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex flex-wrap gap-2 border-b border-border/50 pb-1">
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href || pathname === `${tab.href}/`
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/12 text-primary ring-1 ring-primary/25 ring-b-transparent"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
