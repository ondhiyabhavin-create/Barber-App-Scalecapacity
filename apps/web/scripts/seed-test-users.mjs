/**
 * Creates Auth users + public.users rows for owner / staff / client (same tenant),
 * barbers, services, working hours, demo CRM clients, sample appointments, and optional notifications.
 * Requires SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local (never commit).
 * Re-run after schema changes or to refresh demo data.
 *
 * Usage (from repo root): pnpm --filter web seed:test-users
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv(join(__dirname, "..", ".env.local"));

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const PASSWORD = "12345678";
const TENANT_SLUG = "demo-all-roles";

const USERS = [
  {
    email: "test-owner@example.com",
    role: "owner",
    name: "Test Owner",
  },
  {
    email: "test-staff@example.com",
    role: "staff",
    name: "Test Staff",
  },
  {
    email: "test-client@example.com",
    role: "client",
    name: "Test Client",
  },
];

async function main() {
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Add SUPABASE_SERVICE_ROLE_KEY to apps/web/.env.local (Project Settings → API → service_role).\n" +
        "Never expose service_role in the browser or commit it."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingTenant, error: tErr } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", TENANT_SLUG)
    .maybeSingle();

  if (tErr) {
    console.error("tenants lookup:", tErr.message);
    process.exit(1);
  }

  let tenantId = existingTenant?.id;

  if (!tenantId) {
    const { data: t, error: insT } = await supabase
      .from("tenants")
      .insert({
        name: "Demo Shop (all roles)",
        slug: TENANT_SLUG,
        business_type: "barbershop",
        onboarding_completed: true,
        city: "Demo City",
      })
      .select("id")
      .single();

    if (insT) {
      console.error("insert tenant:", insT.message);
      process.exit(1);
    }
    tenantId = t.id;
    console.log("Created tenant", TENANT_SLUG, tenantId);
  } else {
    console.log("Using existing tenant", TENANT_SLUG, tenantId);
  }

  const createdIds = {};

  for (const u of USERS) {
    const { data: list } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const found = list?.users?.find((x) => x.email === u.email);
    if (found) {
      await supabase.auth.admin.deleteUser(found.id);
      console.log("Removed existing auth user:", u.email);
    }

    const { data: authData, error: authErr } =
      await supabase.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });

    if (authErr) {
      console.error("createUser", u.email, authErr.message);
      process.exit(1);
    }

    createdIds[u.role] = authData.user.id;
    console.log("Auth user:", u.email, authData.user.id);
  }

  const { error: e1 } = await supabase.from("users").insert({
    id: createdIds.owner,
    tenant_id: tenantId,
    role: "owner",
    name: USERS[0].name,
    email: USERS[0].email,
  });
  if (e1) {
    console.error("insert owner profile:", e1.message);
    process.exit(1);
  }

  const { error: e2 } = await supabase.from("users").insert({
    id: createdIds.staff,
    tenant_id: tenantId,
    role: "staff",
    name: USERS[1].name,
    email: USERS[1].email,
  });
  if (e2) {
    console.error("insert staff profile:", e2.message);
    process.exit(1);
  }

  const { error: e3 } = await supabase.from("users").insert({
    id: createdIds.client,
    tenant_id: tenantId,
    role: "client",
    name: USERS[2].name,
    email: USERS[2].email,
  });
  if (e3) {
    console.error("insert client profile:", e3.message);
    process.exit(1);
  }

  await supabase.from("notifications").delete().eq("tenant_id", tenantId);
  await supabase.from("appointments").delete().eq("tenant_id", tenantId);
  await supabase.from("clients").delete().eq("tenant_id", tenantId);
  await supabase.from("barbers").delete().eq("tenant_id", tenantId);

  const { error: b1 } = await supabase
    .from("barbers")
    .insert({
      tenant_id: tenantId,
      user_id: createdIds.owner,
      display_name: "Test Owner",
    })
    .select("id")
    .single();

  if (b1) {
    console.error("insert owner barber:", b1.message);
    process.exit(1);
  }

  const { error: b2 } = await supabase.from("barbers").insert({
    tenant_id: tenantId,
    user_id: createdIds.staff,
    display_name: "Test Staff",
  });
  if (b2) {
    console.error("insert staff barber:", b2.message);
    process.exit(1);
  }

  const { count: svcCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (!svcCount) {
    await supabase.from("services").insert({
      tenant_id: tenantId,
      name: "Signature cut",
      duration_min: 30,
      price_cents: 4500,
      category: "Haircut",
    });
    console.log("Added default service");
  }

  const { data: svcRow } = await supabase
    .from("services")
    .select("id, duration_min")
    .eq("tenant_id", tenantId)
    .limit(1)
    .single();

  if (!svcRow) {
    console.error("No service row for tenant");
    process.exit(1);
  }

  const { data: barbers } = await supabase
    .from("barbers")
    .select("id")
    .eq("tenant_id", tenantId);

  for (const b of barbers || []) {
    await supabase.from("working_hours").delete().eq("barber_id", b.id);
    for (const day of [1, 2, 3, 4, 5]) {
      await supabase.from("working_hours").insert({
        barber_id: b.id,
        day_of_week: day,
        start_time: "09:00:00",
        end_time: "17:00:00",
      });
    }
  }
  console.log("Seeded working hours Mon–Fri for each barber");

  const barberIds = (barbers ?? []).map((b) => b.id);
  if (barberIds.length < 1) {
    console.error("No barbers to seed appointments");
    process.exit(1);
  }

  const demoClients = [
    { name: "Alex Rivera", email: "alex.demo@example.com", phone: "555-0101" },
    { name: "Jordan Lee", email: "jordan.demo@example.com", phone: "555-0102" },
    { name: "Sam Chen", email: "sam.demo@example.com", phone: "555-0103" },
  ];

  const { data: insertedClients, error: clientErr } = await supabase
    .from("clients")
    .insert(
      demoClients.map((c) => ({
        tenant_id: tenantId,
        name: c.name,
        email: c.email,
        phone: c.phone,
      }))
    )
    .select("id");

  if (clientErr) {
    console.error("insert demo clients:", clientErr.message);
    process.exit(1);
  }

  const cids = (insertedClients ?? []).map((c) => c.id);
  console.log("Seeded", cids.length, "demo clients");

  const dur = svcRow.duration_min;
  const addMin = (iso, minutes) =>
    new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();

  /** UTC slots over the next several days — non-overlapping per barber */
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  const slot = (dayOffset, hourUTC, barberIdx, clientIdx) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + dayOffset);
    d.setUTCHours(hourUTC, 0, 0, 0);
    const start = d.toISOString();
    return {
      tenant_id: tenantId,
      client_id: cids[clientIdx % cids.length],
      barber_id: barberIds[barberIdx % barberIds.length],
      service_id: svcRow.id,
      start_time: start,
      end_time: addMin(start, dur),
      status: "confirmed",
    };
  };

  const appointmentRows = [
    slot(1, 14, 0, 0),
    slot(1, 16, 1, 1),
    slot(2, 15, 0, 2),
    slot(3, 10, 1, 0),
    slot(4, 11, 0, 1),
    slot(5, 13, 1, 2),
  ];

  const { error: apptErr } = await supabase.from("appointments").insert(appointmentRows);
  if (apptErr) {
    console.error("insert demo appointments:", apptErr.message);
    process.exit(1);
  }
  console.log("Seeded", appointmentRows.length, "demo appointments (next ~7 days, UTC slots)");

  const { error: notifErr } = await supabase.from("notifications").insert({
    tenant_id: tenantId,
    user_id: createdIds.owner,
    type: "demo",
    message: "Welcome to BarberOS — demo notification.",
    read: false,
  });
  if (notifErr) {
    console.warn("optional notification seed:", notifErr.message);
  } else {
    console.log("Seeded 1 demo notification for owner");
  }

  console.log("\n--- Test logins (password for all): " + PASSWORD + " ---\n");
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(8)}  ${u.email}`);
  }
  console.log(
    "\nPublic booking: /book/" +
      TENANT_SLUG +
    "\nOwner/Staff: use Login with emails above. Client role is for future client-app flows."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
