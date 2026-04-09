import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardHomePage() {
  const { tenant, profile } = await getSessionProfile();
  const supabase = await createClient();

  const tenantId = tenant?.id;
  let apptCount = 0;
  let clientCount = 0;

  if (tenantId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count: a } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("start_time", start.toISOString());
    const { count: c } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    apptCount = a ?? 0;
    clientCount = c ?? 0;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Overview
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          <span className="text-gradient">{tenant?.name ?? "Your shop"}</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          {profile?.role === "client"
            ? "Your shop workspace — book visits on the public page."
            : "Realtime calendar, CRM, and public booking — all scoped to your workspace."}
        </p>
      </div>

      {profile?.role === "client" && tenant?.slug ? (
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 to-accent/5 p-4 md:p-5">
          <p className="text-sm font-medium text-foreground">Book as a guest</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Client accounts use the public booking flow — no staff tools here.
          </p>
          <Link
            href={`/book/${tenant.slug}`}
            className={cn(
              buttonVariants(),
              "mt-4 inline-flex rounded-xl shadow-lg shadow-primary/15"
            )}
          >
            Open booking page
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
          <div className="glass-strong rounded-[15px]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <CalendarDays className="size-5" />
                </span>
                Today&apos;s appointments
              </CardTitle>
              <CardDescription>Scheduled from midnight local time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl font-semibold tabular-nums tracking-tight">
                {apptCount}
              </p>
            </CardContent>
          </div>
        </Card>
        <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
          <div className="glass-strong rounded-[15px]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <Users className="size-5" />
                </span>
                Clients
              </CardTitle>
              <CardDescription>Profiles in your CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl font-semibold tabular-nums tracking-tight">
                {clientCount}
              </p>
            </CardContent>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/calendar"
          className={cn(
            buttonVariants(),
            "rounded-xl shadow-lg shadow-primary/15"
          )}
        >
          Open calendar
        </Link>
        {tenant?.slug ? (
          <Link
            href={`/book/${tenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl border-border/70"
            )}
          >
            Preview booking page
          </Link>
        ) : null}
      </div>
    </div>
  );
}
