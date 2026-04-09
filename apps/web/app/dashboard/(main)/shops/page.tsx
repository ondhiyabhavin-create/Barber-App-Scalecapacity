import Link from "next/link";
import { Plus } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/shared/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShopsManager, type ManagedShop } from "@/components/shops/shops-manager";

export default async function ShopsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || profile?.role !== "owner") return null;
  const supabase = await createClient();
  const { data: shops } = await supabase
    .from("tenants")
    .select("id,name,slug,city,region,country,logo_url,icon_emoji,is_active,archived_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <PageShell
      eyebrow="Shops"
      title="Shop management"
      description="Create and manage multiple shop locations."
      actions={
        <Link href="/dashboard/shops/new" className={cn(buttonVariants(), "rounded-xl")}>
          <Plus className="mr-2 size-4" /> Create new shop
        </Link>
      }
    >
      <ShopsManager initialShops={(shops ?? []) as ManagedShop[]} />
    </PageShell>
  );
}
