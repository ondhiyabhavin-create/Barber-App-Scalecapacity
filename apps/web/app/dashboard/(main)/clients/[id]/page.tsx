import { notFound, redirect } from "next/navigation";
import { Phone } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { ClientNotesForm } from "@/components/clients/client-notes-form";
import { SmartAvatar } from "@/components/shared/smart-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppCard } from "@/components/shared/app-card";

type Props = { params: { id: string } };

export default async function ClientDetailPage({ params }: Props) {
  const { tenant, profile } = await getSessionProfile();
  if (profile?.role === "client") {
    redirect("/dashboard");
  }
  if (!tenant?.id) redirect("/dashboard/onboarding");

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!client) notFound();

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `
      id,
      start_time,
      status,
      services ( name, price_cents ),
      barbers ( display_name )
    `
    )
    .eq("tenant_id", tenant.id)
    .eq("client_id", client.id)
    .order("start_time", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AppCard className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <SmartAvatar name={client.name} className="size-16" fallbackClassName="text-lg" />
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">{client.email ?? "No email"}</p>
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="size-3.5" /> {client.phone ?? "No phone"}
            </p>
          </div>
        </div>
      </AppCard>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <AppCard className="p-4">
            <p className="text-sm text-muted-foreground">
              Lifetime value:{" "}
              <span className="font-medium text-foreground">
                ${Number(client.lifetime_value ?? 0).toFixed(2)}
              </span>
            </p>
          </AppCard>
        </TabsContent>
        <TabsContent value="visits">
          <div>
            <h2 className="mb-3 font-heading text-xl">Recent visits</h2>
            <div className="space-y-2">
              {appointments?.length ? (
                appointments.map((a) => (
                  <div
                    key={a.id}
                    className="glass-panel flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(a.start_time).toLocaleString()}
                      </p>
                      <p className="text-muted-foreground">
                        {(a.services as { name?: string } | null)?.name ?? "Service"} ·{" "}
                        {(a.barbers as { display_name?: string } | null)?.display_name ??
                          "Barber"}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase">
                      {a.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No appointments yet.</p>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="notes">
          <ClientNotesForm
            clientId={client.id}
            tenantId={tenant.id}
            initialNotes={client.haircut_notes ?? ""}
            initialTags={(client.tags as string[] | null) ?? []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
