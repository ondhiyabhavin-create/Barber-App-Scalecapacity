import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientQuickAdd } from "@/components/clients/client-quick-add";

export default async function ClientsPage() {
  const { tenant } = await getSessionProfile();
  const supabase = await createClient();
  if (!tenant?.id) return null;

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            CRM
          </p>
          <h1 className="font-heading text-3xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">
            Profiles, notes, tags, and lifetime value.
          </p>
        </div>
        <ClientQuickAdd tenantId={tenant.id} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {clients?.length ? (
          clients.map((c) => (
            <Card
              key={c.id}
              className="glass-panel border-border/60 bg-card/50 transition hover:border-primary/40"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/clients/${c.id}`}
                    className="hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="text-sm font-normal text-muted-foreground">
                    ${Number(c.lifetime_value ?? 0).toFixed(0)} LTV
                  </span>
                </CardTitle>
                <CardDescription>
                  {c.email ?? "No email"} · {c.phone ?? "No phone"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(c.tags as string[] | null)?.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="glass-panel border-dashed border-border/60 bg-card/30 md:col-span-2">
            <CardHeader>
              <CardTitle>No clients yet</CardTitle>
              <CardDescription>
                Add walk-ins or import from bookings — start with a quick add.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
