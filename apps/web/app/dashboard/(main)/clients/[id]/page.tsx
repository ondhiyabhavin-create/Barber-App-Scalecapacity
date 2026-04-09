import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { ClientNotesForm } from "@/components/clients/client-notes-form";

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
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Client
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          <span className="text-gradient">{client.name}</span>
        </h1>
        <p className="text-muted-foreground">
          {client.email ?? "—"} · {client.phone ?? "—"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Lifetime value:{" "}
          <span className="font-medium text-foreground">
            ${Number(client.lifetime_value ?? 0).toFixed(2)}
          </span>
        </p>
      </div>

      <ClientNotesForm
        clientId={client.id}
        tenantId={tenant.id}
        initialNotes={client.haircut_notes ?? ""}
        initialTags={(client.tags as string[] | null) ?? []}
      />

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
    </div>
  );
}
