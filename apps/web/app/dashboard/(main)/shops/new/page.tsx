import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/profile";
import { PageShell } from "@/components/shared/page-shell";
import { ShopCreationWizard } from "@/components/shops/shop-creation-wizard";

export default async function NewShopPage() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (profile?.role !== "owner") redirect("/dashboard");

  return (
    <PageShell
      eyebrow="Shops"
      title="Create new shop"
      description="Set up business details, branding, location, geo coordinates, and operations."
    >
      <ShopCreationWizard ownerUserId={user.id} />
    </PageShell>
  );
}
