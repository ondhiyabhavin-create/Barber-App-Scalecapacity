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
  const { tenant } = await getSessionProfile();
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
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
        <h1 className="font-heading text-3xl font-semibold">
          {tenant?.name ?? "Your shop"}
        </h1>
        <p className="text-muted-foreground">
          Realtime calendar, CRM, and public booking — all scoped to your workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-panel border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="size-5 text-primary" />
              Today&apos;s appointments
            </CardTitle>
            <CardDescription>Scheduled from midnight local time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl font-semibold">{apptCount}</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-5 text-primary" />
              Clients
            </CardTitle>
            <CardDescription>Profiles in your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl font-semibold">{clientCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/calendar" className={cn(buttonVariants())}>
          Open calendar
        </Link>
        {tenant?.slug ? (
          <Link
            href={`/book/${tenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Preview booking page
          </Link>
        ) : null}
      </div>
    </div>
  );
}
