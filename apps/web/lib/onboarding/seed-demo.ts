import type { SupabaseClient } from "@supabase/supabase-js";

export async function seedTenantDemoData(
  supabase: SupabaseClient,
  tenantId: string,
  barberId: string
) {
  const { count: existing } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if ((existing ?? 0) > 0) return;

  const clientsPayload = [
    { tenant_id: tenantId, name: "Alex Rivera", email: "alex@example.com", phone: "+1 555 100 0011", tags: ["VIP"] },
    { tenant_id: tenantId, name: "Jamie Cole", email: "jamie@example.com", phone: "+1 555 100 0012", tags: ["Regular"] },
    { tenant_id: tenantId, name: "Taylor Dean", email: "taylor@example.com", phone: "+1 555 100 0013", tags: ["New"] },
  ];
  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .insert(clientsPayload)
    .select("id");
  if (clientErr) throw clientErr;

  const { data: services, error: svcErr } = await supabase
    .from("services")
    .select("id, duration_min")
    .eq("tenant_id", tenantId)
    .limit(2);
  if (svcErr) throw svcErr;
  if (!services?.length || !clients?.length) return;

  const base = new Date();
  base.setHours(10, 0, 0, 0);
  const appointments = [0, 1].map((index) => {
    const start = new Date(base);
    start.setDate(start.getDate() + index);
    const duration = Number(services[index % services.length].duration_min ?? 30);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    return {
      tenant_id: tenantId,
      client_id: clients[index % clients.length].id,
      barber_id: barberId,
      service_id: services[index % services.length].id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "confirmed",
    };
  });

  const { error: apptErr } = await supabase.from("appointments").insert(appointments);
  if (apptErr) throw apptErr;
}
