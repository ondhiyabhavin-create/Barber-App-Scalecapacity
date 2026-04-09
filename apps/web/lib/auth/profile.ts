import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export type ProfileRow = {
  id: string;
  tenant_id: string | null;
  role: "owner" | "staff" | "client";
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  icon_emoji: string | null;
};

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  address_line: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  logo_url: string | null;
  icon_emoji: string | null;
  plan: string;
  onboarding_completed: boolean;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  archived_at: string | null;
  owner_user_id: string | null;
};

export type ImpersonationState = {
  role: "owner" | "staff" | "client";
  userId: string | null;
};

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, tenant: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const p = profile as ProfileRow | null;
  let tenant: TenantRow | null = null;

  if (p?.tenant_id) {
    const { data: t } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", p.tenant_id)
      .single();
    tenant = t as TenantRow | null;
  }

  let impersonation: ImpersonationState | null = null;
  let effectiveRole = p?.role ?? null;
  if (p?.role === "owner") {
    const cookieStore = await cookies();
    const raw = cookieStore.get("barberos_impersonation")?.value;
    if (raw) {
      const [role, userId] = raw.split(":");
      if (role === "owner" || role === "staff" || role === "client") {
        impersonation = { role, userId: userId || null };
        effectiveRole = role;
      }
    }
  }

  return { user, profile: p, tenant, effectiveRole, impersonation };
}
