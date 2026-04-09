import { getSessionProfile } from "@/lib/auth/profile";
import { ServicesManager } from "@/components/settings/services-manager";
import { PageShell } from "@/components/shared/page-shell";

export default async function ServicesPage() {
  const { tenant } = await getSessionProfile();
  if (!tenant?.id) return null;

  return (
    <PageShell
      eyebrow="Services"
      title="Service catalog"
      description="Define what clients can book: name, duration, and pricing."
    >
      <ServicesManager tenantId={tenant.id} />
    </PageShell>
  );
}
