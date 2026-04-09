import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/profile";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ModeToggle } from "@/components/mode-toggle";

export default async function OnboardingPage() {
  const { user, profile, tenant } = await getSessionProfile();

  if (!user) {
    redirect("/login");
  }

  if (tenant?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,168,76,0.08),_transparent_50%)]" />
      <header className="relative z-10 flex items-center justify-end px-6 py-4">
        <ModeToggle />
      </header>
      <OnboardingWizard hasProfile={!!profile} />
    </div>
  );
}
