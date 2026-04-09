import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientQuickAdd } from "@/components/clients/client-quick-add";
import { ClientsTable, type ClientRow } from "@/components/clients/clients-table";

export default async function ClientsPage() {
  const { tenant, profile } = await getSessionProfile();
  if (profile?.role === "client") {
    redirect("/dashboard");
  }
  const supabase = await createClient();
  if (!tenant?.id) return null;

  const { data: rows } = await supabase
    .from("clients")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const clients: ClientRow[] = (rows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    lifetime_value: c.lifetime_value != null ? Number(c.lifetime_value) : null,
    tags: Array.isArray(c.tags) ? c.tags : null,
    created_at: c.created_at,
  }));

  return (
    <div className="app-content-max space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            CRM
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            <span className="text-gradient">Clients</span>
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Profiles, notes, tags, and lifetime value.
          </p>
        </div>
        {clients.length > 0 ? <ClientQuickAdd tenantId={tenant.id} /> : null}
      </div>

      {clients.length > 0 ? (
        <ClientsTable clients={clients} />
      ) : (
        <Card className="shine-border overflow-hidden rounded-2xl border-0 border-dashed bg-transparent p-[1px]">
          <div className="glass-strong rounded-[15px] border-dashed border-border/50 px-6 py-14 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Users className="size-8" aria-hidden />
            </div>
            <CardHeader className="p-0">
              <CardTitle className="font-heading text-2xl">Add your first client</CardTitle>
              <CardDescription className="mx-auto max-w-md text-base">
                Walk-ins and booking guests appear here — start with a quick add, or import when
                that&apos;s ready.
              </CardDescription>
            </CardHeader>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ClientQuickAdd tenantId={tenant.id} />
              <Button type="button" variant="outline" className="rounded-xl" disabled>
                Import (soon)
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
