"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogoutButton } from "@/components/auth/logout-button";
import { Separator } from "@/components/ui/separator";

type DashboardRole = "owner" | "staff" | "client";

type Props = {
  role?: DashboardRole;
  tenantSlug?: string | null;
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardBottomNav({ role, tenantSlug }: Props) {
  const pathname = usePathname();
  const r = role ?? "owner";
  const [moreOpen, setMoreOpen] = React.useState(false);

  /** Home + Calendar + (Clients | Book) — fourth slot is More */
  const primary: { href: string; label: string; icon: typeof LayoutDashboard }[] = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  ];
  if (r === "client") {
    if (tenantSlug) {
      primary.push({
        href: `/book/${tenantSlug}`,
        label: "Book",
        icon: ExternalLink,
      });
    }
  } else {
    primary.push({ href: "/dashboard/clients", label: "Clients", icon: Users });
  }

  const moreLinks: { href: string; label: string; icon: typeof Megaphone }[] = [
    { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone },
  ];
  if (r === "owner") {
    moreLinks.push({ href: "/dashboard/settings", label: "Settings", icon: Settings });
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/90 pb-[env(safe-area-inset-bottom)] shadow-md backdrop-blur-md md:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex h-16 max-w-[var(--app-content-max-width)] items-stretch justify-around px-1">
          {primary.map((item) => {
            const active =
              item.href.startsWith("/book/") ? false : isActive(pathname, item.href);
            const isExternal = item.href.startsWith("/book/");
            const inner = (
              <>
                <item.icon className="size-5 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </>
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {inner}
              </Link>
            );
          })}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <Menu className="size-5 shrink-0" aria-hidden />
              <span className="truncate">More</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl" showCloseButton>
              <SheetHeader className="text-left">
                <SheetTitle className="font-heading">More</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-6">
                {moreLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-11 justify-start gap-2 rounded-xl px-3"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                ))}
                {tenantSlug ? (
                  <a
                    href={`/book/${tenantSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "inline-flex h-11 items-center justify-start gap-2 rounded-xl px-3"
                    )}
                  >
                    <ExternalLink className="size-4 shrink-0" />
                    Open booking page
                  </a>
                ) : null}
                <Separator className="my-2" />
                <div className="pt-1">
                  <LogoutButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
