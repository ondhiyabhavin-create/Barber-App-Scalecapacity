import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ClientQuickAdd } from "@/components/clients/client-quick-add";
import { ClientsTable, type ClientRow } from "@/components/clients/clients-table";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/shared/empty-state";

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
    last_visit: null,
    total_spent: c.lifetime_value != null ? Number(c.lifetime_value) : 0,
  }));

  return (
    <PageShell
      eyebrow="CRM"
      title="Clients"
      description="Track contacts, visits, notes, and value."
      actions={<ClientQuickAdd tenantId={tenant.id} />}
    >

      {clients.length > 0 ? (
        <ClientsTable clients={clients} />
      ) : (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start tracking visits and total spend."
          cta={
            <div className="flex items-center gap-2">
              <ClientQuickAdd tenantId={tenant.id} />
              <Button type="button" variant="outline" className="rounded-xl" disabled>
                Import (soon)
              </Button>
            </div>
          }
        />
      )}
    </PageShell>
  );
}
