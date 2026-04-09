import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/profile";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getSessionProfile();
  if (profile?.role !== "owner") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Settings
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          <span className="text-gradient">Owner workspace</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Only the <strong className="font-medium text-foreground">owner</strong> role sees
          this area — billing, service catalog, and registered users for your shop.
        </p>
      </div>
      <SettingsTabs />
      {children}
    </div>
  );
}
