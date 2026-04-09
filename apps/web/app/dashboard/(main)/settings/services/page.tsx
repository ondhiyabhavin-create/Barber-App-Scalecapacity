import { getSessionProfile } from "@/lib/auth/profile";
import { ServicesManager } from "@/components/settings/services-manager";

export default async function SettingsServicesPage() {
  const { tenant } = await getSessionProfile();
  if (!tenant?.id) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">Services</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Add cuts, trims, and packages — same data as onboarding.{" "}
          <strong className="font-medium text-foreground">Staff</strong> can use these in the
          calendar; only <strong className="font-medium text-foreground">owners</strong> see this
          settings tab to edit the catalog.
        </p>
      </div>
      <ServicesManager tenantId={tenant.id} />
    </div>
  );
}
