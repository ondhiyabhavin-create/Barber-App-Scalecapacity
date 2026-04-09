import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/shared/page-shell";
import { AppCard } from "@/components/shared/app-card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmartAvatar } from "@/components/shared/smart-avatar";

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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(shops ?? []).map((shop) => (
          <AppCard key={shop.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <SmartAvatar name={shop.name} src={shop.logo_url} emoji={shop.icon_emoji} />
                <span>{shop.name}</span>
              </CardTitle>
              <CardDescription>{shop.city ?? "Unknown city"}, {shop.region ?? "-"}, {shop.country ?? "-"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">/{shop.slug}</p>
              <p>{shop.is_active ? "Active" : "Inactive"} {shop.archived_at ? "• Archived" : ""}</p>
              <div className="flex gap-2">
                <Link href={`/book/${shop.slug}`} className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
                  Preview
                </Link>
              </div>
            </CardContent>
          </AppCard>
        ))}
      </div>
      {(shops ?? []).length === 0 ? (
        <AppCard className="p-10 text-center">
          <Building2 className="mx-auto mb-3 size-8 text-primary" />
          <h3 className="font-heading text-xl font-semibold">No shops yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Create your first shop to start location-based discovery.</p>
        </AppCard>
      ) : null}
    </PageShell>
  );
}
