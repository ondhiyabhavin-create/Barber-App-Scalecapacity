import { createClient } from "@/lib/supabase/server";

export type ProfileRow = {
  id: string;
  tenant_id: string | null;
  role: "owner" | "staff" | "client";
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
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
  plan: string;
  onboarding_completed: boolean;
  timezone: string;
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

  return { user, profile: p, tenant };
}
