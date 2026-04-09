/**
 * Full product demo seed for BarberOS.
 *
 * Seeds:
 * - Auth users (owner/staff/client)
 * - Primary workspace with users, barbers, services, working hours
 * - CRM clients, appointments, notifications
 * - Additional owner-managed shops for marketplace/location flow
 *
 * Usage (repo root):
 *   pnpm seed:all
 *
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 * - SUPABASE_SERVICE_ROLE_KEY
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
const PRIMARY_TENANT = {
  slug: "demo-all-roles",
  name: "Demo Shop (all roles)",
  city: "London",
  region: "England",
  country: "GB",
  icon_emoji: "💈",
  latitude: 51.5072,
  longitude: -0.1276,
};

const EXTRA_SHOPS = [
  {
    slug: "northside-fades",
    name: "Northside Fades",
    city: "Manchester",
    region: "England",
    country: "GB",
    icon_emoji: "✂️",
    latitude: 53.4808,
    longitude: -2.2426,
  },
  {
    slug: "city-beard-club",
    name: "City Beard Club",
    city: "Birmingham",
    region: "England",
    country: "GB",
    icon_emoji: "🧔",
    latitude: 52.4862,
    longitude: -1.8904,
  },
  {
    slug: "coastal-cut-lounge",
    name: "Coastal Cut Lounge",
    city: "Brighton",
    region: "England",
    country: "GB",
    icon_emoji: "🌊",
    latitude: 50.8225,
    longitude: -0.1372,
  },
];

const USERS = [
  {
    email: "test-owner@example.com",
    role: "owner",
    name: "Test Owner",
    icon_emoji: "🧑‍💼",
  },
  {
    email: "test-staff@example.com",
    role: "staff",
    name: "Test Staff",
    icon_emoji: "✂️",
  },
  {
    email: "test-client@example.com",
    role: "client",
    name: "Test Client",
    icon_emoji: "🙂",
  },
];

function plusMinutes(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

async function ensureAuthUsers(supabase) {
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

    const { data: authData, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.name },
    });

    if (error) {
      throw new Error(`createUser ${u.email}: ${error.message}`);
    }
    createdIds[u.role] = authData.user.id;
    console.log("Auth user:", u.email, authData.user.id);
  }

  return createdIds;
}

async function recreateTenantBySlug(supabase, tenant, ownerUserId) {
  const { data: existing } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenant.slug)
    .maybeSingle();

  if (existing?.id) {
    const { error: delErr } = await supabase.from("tenants").delete().eq("id", existing.id);
    if (delErr) throw new Error(`delete existing tenant ${tenant.slug}: ${delErr.message}`);
  }

  const { data: created, error: createErr } = await supabase
    .from("tenants")
    .insert({
      name: tenant.name,
      slug: tenant.slug,
      business_type: "barbershop",
      onboarding_completed: true,
      city: tenant.city,
      region: tenant.region,
      country: tenant.country,
      icon_emoji: tenant.icon_emoji,
      latitude: tenant.latitude,
      longitude: tenant.longitude,
      owner_user_id: ownerUserId,
      is_active: true,
    })
    .select("id")
    .single();

  if (createErr) {
    throw new Error(`insert tenant ${tenant.slug}: ${createErr.message}`);
  }

  return created.id;
}

async function seedPrimaryWorkspace(supabase, tenantId, createdIds) {
  // Profiles
  for (const u of USERS) {
    const { error } = await supabase.from("users").insert({
      id: createdIds[u.role],
      tenant_id: tenantId,
      role: u.role,
      name: u.name,
      email: u.email,
      icon_emoji: u.icon_emoji,
    });
    if (error) throw new Error(`insert profile ${u.email}: ${error.message}`);
  }

  // Barbers
  const { data: ownerBarber, error: ownerBarberErr } = await supabase
    .from("barbers")
    .insert({
      tenant_id: tenantId,
      user_id: createdIds.owner,
      display_name: "Test Owner",
      avatar_url: null,
    })
    .select("id")
    .single();
  if (ownerBarberErr) throw new Error(`insert owner barber: ${ownerBarberErr.message}`);

  const { data: staffBarber, error: staffBarberErr } = await supabase
    .from("barbers")
    .insert({
      tenant_id: tenantId,
      user_id: createdIds.staff,
      display_name: "Test Staff",
      avatar_url: null,
    })
    .select("id")
    .single();
  if (staffBarberErr) throw new Error(`insert staff barber: ${staffBarberErr.message}`);

  const barberIds = [ownerBarber.id, staffBarber.id];

  // Working hours
  for (const barberId of barberIds) {
    for (const day of [1, 2, 3, 4, 5, 6]) {
      const { error } = await supabase.from("working_hours").insert({
        barber_id: barberId,
        day_of_week: day,
        start_time: "09:00:00",
        end_time: "19:00:00",
      });
      if (error) throw new Error(`insert working hours: ${error.message}`);
    }
  }

  // Services
  const servicesPayload = [
    { name: "Signature cut", duration_min: 30, price_cents: 4500, category: "Haircut" },
    { name: "Beard + line up", duration_min: 25, price_cents: 3500, category: "Beard" },
    { name: "Skin fade", duration_min: 45, price_cents: 5500, category: "Haircut" },
  ];
  const { data: services, error: svcErr } = await supabase
    .from("services")
    .insert(
      servicesPayload.map((s) => ({
        tenant_id: tenantId,
        ...s,
      }))
    )
    .select("id, duration_min");
  if (svcErr) throw new Error(`insert services: ${svcErr.message}`);

  // Clients
  const demoClients = [
    { name: "Alex Rivera", email: "alex.demo@example.com", phone: "+44 7700 900001", tags: ["VIP"] },
    { name: "Jordan Lee", email: "jordan.demo@example.com", phone: "+44 7700 900002", tags: ["Regular"] },
    { name: "Sam Chen", email: "sam.demo@example.com", phone: "+44 7700 900003", tags: ["New"] },
    { name: "Taylor Dean", email: "taylor.demo@example.com", phone: "+44 7700 900004", tags: ["Walk-in"] },
    { name: "Mia Brooks", email: "mia.demo@example.com", phone: "+44 7700 900005", tags: ["VIP"] },
  ];
  const { data: clients, error: clientsErr } = await supabase
    .from("clients")
    .insert(
      demoClients.map((c) => ({
        tenant_id: tenantId,
        name: c.name,
        email: c.email,
        phone: c.phone,
        tags: c.tags,
      }))
    )
    .select("id");
  if (clientsErr) throw new Error(`insert clients: ${clientsErr.message}`);

  // Appointments over next days
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  const slot = (dayOffset, hourUTC, barberIdx, clientIdx, serviceIdx) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + dayOffset);
    d.setUTCHours(hourUTC, 0, 0, 0);
    const start = d.toISOString();
    const svc = services[serviceIdx % services.length];
    return {
      tenant_id: tenantId,
      client_id: clients[clientIdx % clients.length].id,
      barber_id: barberIds[barberIdx % barberIds.length],
      service_id: svc.id,
      start_time: start,
      end_time: plusMinutes(start, svc.duration_min),
      status: "confirmed",
    };
  };

  const appointmentRows = [
    slot(1, 10, 0, 0, 0),
    slot(1, 12, 1, 1, 1),
    slot(1, 14, 0, 2, 2),
    slot(2, 11, 1, 3, 0),
    slot(2, 16, 0, 4, 1),
    slot(3, 13, 1, 0, 2),
    slot(4, 15, 0, 1, 0),
    slot(5, 10, 1, 2, 1),
  ];
  const { error: apptErr } = await supabase.from("appointments").insert(appointmentRows);
  if (apptErr) throw new Error(`insert appointments: ${apptErr.message}`);

  // Notification
  const { error: notifErr } = await supabase.from("notifications").insert({
    tenant_id: tenantId,
    user_id: createdIds.owner,
    type: "demo",
    message: "Welcome to BarberOS full demo seed.",
    read: false,
  });
  if (notifErr) console.warn("notification seed warning:", notifErr.message);
}

async function seedMarketplaceShops(supabase, ownerUserId) {
  for (const shop of EXTRA_SHOPS) {
    const tenantId = await recreateTenantBySlug(supabase, shop, ownerUserId);

    const { data: barber, error: barberErr } = await supabase
      .from("barbers")
      .insert({
        tenant_id: tenantId,
        display_name: `${shop.name} Team`,
      })
      .select("id")
      .single();
    if (barberErr) throw new Error(`insert barber (${shop.slug}): ${barberErr.message}`);

    for (const day of [1, 2, 3, 4, 5, 6]) {
      const { error: whErr } = await supabase.from("working_hours").insert({
        barber_id: barber.id,
        day_of_week: day,
        start_time: "10:00:00",
        end_time: "18:00:00",
      });
      if (whErr) throw new Error(`insert working hours (${shop.slug}): ${whErr.message}`);
    }

    const { error: svcErr } = await supabase.from("services").insert([
      {
        tenant_id: tenantId,
        name: "Quick trim",
        duration_min: 20,
        price_cents: 2500,
        category: "Trim",
      },
      {
        tenant_id: tenantId,
        name: "Classic cut",
        duration_min: 35,
        price_cents: 4200,
        category: "Haircut",
      },
    ]);
    if (svcErr) throw new Error(`insert services (${shop.slug}): ${svcErr.message}`);
  }
}

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

  const createdIds = await ensureAuthUsers(supabase);
  const primaryTenantId = await recreateTenantBySlug(supabase, PRIMARY_TENANT, createdIds.owner);

  await seedPrimaryWorkspace(supabase, primaryTenantId, createdIds);
  await seedMarketplaceShops(supabase, createdIds.owner);

  console.log("\n=== BarberOS full seed complete ===");
  console.log("Owner login :", "test-owner@example.com");
  console.log("Staff login :", "test-staff@example.com");
  console.log("Client login:", "test-client@example.com");
  console.log("Password    :", PASSWORD);
  console.log("\nPrimary shop booking:", `/book/${PRIMARY_TENANT.slug}`);
  for (const s of EXTRA_SHOPS) {
    console.log("Marketplace shop booking:", `/book/${s.slug}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
