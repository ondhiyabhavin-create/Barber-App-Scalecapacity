"use client";

/**
 * Test-only: quick sign-in as seeded owner / staff / client accounts.
 * Remove or gate behind env before a production launch.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, Users } from "lucide-react";

const PASSWORD = "12345678";

const ACCOUNTS = [
  { email: "test-owner@example.com", label: "Owner", role: "owner" as const },
  { email: "test-staff@example.com", label: "Staff", role: "staff" as const },
  { email: "test-client@example.com", label: "Client", role: "client" as const },
];

export function RoleSwitcherBar() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const refreshRole = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentEmail(user?.email ?? null);
  }, [supabase]);

  useEffect(() => {
    void refreshRole();
  }, [refreshRole]);

  async function switchTo(email: string, label: string) {
    if (currentEmail === email) {
      toast.message(`Already signed in as ${label}`);
      return;
    }
    setLoadingRole(email);
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });
    setLoadingRole(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Signed in as ${label}`);
    await refreshRole();
    router.refresh();
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[100] flex justify-center p-3 md:bottom-0 md:pb-[max(0.75rem,env(safe-area-inset-bottom))] bottom-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom,0px))] pb-2"
      aria-label="Test role switcher"
    >
      <div className="pointer-events-auto shine-border max-w-lg rounded-2xl p-[1px]">
        <div className="glass-strong flex flex-wrap items-center justify-center gap-2 rounded-[15px] px-3 py-2.5 shadow-2xl">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5 shrink-0" />
            Test roles
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {ACCOUNTS.map((a) => {
              const active = currentEmail === a.email;
              const busy = loadingRole === a.email;
              return (
                <button
                  key={a.email}
                  type="button"
                  disabled={!!loadingRole}
                  onClick={() => void switchTo(a.email, a.label)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
                    active
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/80 text-foreground hover:bg-muted"
                  )}
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
