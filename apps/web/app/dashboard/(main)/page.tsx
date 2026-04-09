import Link from "next/link";
import { CalendarDays, Scissors, Sparkles, UserPlus, Users } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/shared/page-shell";
import { AppCard } from "@/components/shared/app-card";
import { StatCard } from "@/components/shared/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { SmartAvatar } from "@/components/shared/smart-avatar";
import { ShopMarketplace } from "@/components/marketplace/shop-marketplace";

export default async function DashboardHomePage() {
  const { tenant, profile, effectiveRole } = await getSessionProfile();
  const supabase = await createClient();
  const role = effectiveRole ?? profile?.role;

  if (role === "client") {
    const { data: marketplaceRows } = await supabase.rpc("get_marketplace_shops");
    const rows = Array.isArray(marketplaceRows) ? marketplaceRows : [];
    const tenants = (rows.length ? rows : tenant ? [tenant] : []) as Array<{
      id: string;
      name: string;
      slug: string;
      city: string | null;
      region: string | null;
      country: string | null;
      logo_url: string | null;
      icon_emoji: string | null;
      latitude: number | null;
      longitude: number | null;
    }>;

    return (
      <PageShell eyebrow="Marketplace" title="Choose a shop" description="Discover barbershops, compare options, and book your preferred staff.">
        <ShopMarketplace shops={tenants} />
      </PageShell>
    );
  }

  const tenantId = tenant?.id;
  let apptCount = 0;
  let clientCount = 0;
  let revenueToday = 0;
  let nextAppointment: { start_time: string; clients: { name: string } | null } | null = null;

  if (tenantId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const { count: a } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("start_time", start.toISOString());
    const { count: c } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    const { data: todayRows } = await supabase
      .from("appointments")
      .select("start_time, services(price_cents)")
      .eq("tenant_id", tenantId)
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString());
    const { data: nextRow } = await supabase
      .from("appointments")
      .select("start_time, clients(name)")
      .eq("tenant_id", tenantId)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle();
    apptCount = a ?? 0;
    clientCount = c ?? 0;
    revenueToday = (todayRows ?? []).reduce((sum, row) => {
      const svc = row.services as { price_cents?: number } | null;
      return sum + Number(svc?.price_cents ?? 0);
    }, 0);
    nextAppointment = nextRow as { start_time: string; clients: { name: string } | null } | null;
  }

  const hasData = apptCount > 0 || clientCount > 0;

  return (
    <PageShell
      eyebrow="Overview"
      title={tenant?.name ?? "Your shop"}
      description="Today overview, upcoming booking, and quick actions."
      actions={
        <>
          <Link href="/dashboard/calendar" className={cn(buttonVariants(), "rounded-xl")}>
            Open calendar
          </Link>
          <Link href="/dashboard/clients" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
            Add client
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Appointments today" value={apptCount} icon={CalendarDays} hint="Live from your calendar" />
        <StatCard title="Revenue today" value={`$${(revenueToday / 100).toFixed(0)}`} icon={Sparkles} hint="Based on booked services" />
        <StatCard title="Clients" value={clientCount} icon={Users} hint="Profiles in CRM" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <AppCard tone="emphasis">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              Next appointment
            </CardTitle>
            <CardDescription>Never lose track of the next guest.</CardDescription>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div className="flex items-center gap-3">
                <SmartAvatar name={nextAppointment.clients?.name ?? "Guest"} />
                <div>
                  <p className="font-medium">{nextAppointment.clients?.name ?? "Guest"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(nextAppointment.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming bookings yet. Use quick actions to add one in seconds.
              </p>
            )}
          </CardContent>
        </AppCard>

        <AppCard>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Fastest path to your daily tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/dashboard/clients" className={cn(buttonVariants({ variant: "outline" }), "justify-start rounded-xl")}>
              <UserPlus className="mr-2 size-4" /> Add client
            </Link>
            <Link href="/dashboard/calendar" className={cn(buttonVariants({ variant: "outline" }), "justify-start rounded-xl")}>
              <CalendarDays className="mr-2 size-4" /> New booking
            </Link>
            <Link href="/dashboard/services" className={cn(buttonVariants({ variant: "outline" }), "justify-start rounded-xl")}>
              <Scissors className="mr-2 size-4" /> Add service
            </Link>
            <Link href="/dashboard/shops/new" className={cn(buttonVariants({ variant: "outline" }), "justify-start rounded-xl")}>
              <Sparkles className="mr-2 size-4" /> Create new shop
            </Link>
          </CardContent>
        </AppCard>
      </div>

      <SectionHeader
        title="Recent activity"
        description="Bookings, client updates, and service changes."
      />
      <AppCard>
        <CardContent className="space-y-2 pt-4">
          {(hasData
            ? [
                "Appointment count refreshed from calendar.",
                "Client records synced for the workspace.",
                "Dashboard metrics updated in real time.",
              ]
            : [
                "No activity yet - create your first booking.",
                "Add clients to start tracking visits and spend.",
                "Create services so bookings can be scheduled.",
              ]
          ).map((item) => (
            <div key={item} className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm">
              {item}
            </div>
          ))}
        </CardContent>
      </AppCard>

      {role === "client" && tenant?.slug ? (
        <AppCard>
          <CardHeader>
            <CardTitle>Client view</CardTitle>
            <CardDescription>Use the public booking page for new appointments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/book/${tenant.slug}`} className={cn(buttonVariants(), "rounded-xl")}>
              Open booking page
            </Link>
          </CardContent>
        </AppCard>
      ) : null}
      {tenant?.slug ? (
        <div className="pt-2">
          <Link
            href={`/book/${tenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl")}
          >
            Preview booking page
          </Link>
        </div>
      ) : null}
    </PageShell>
  );
}
