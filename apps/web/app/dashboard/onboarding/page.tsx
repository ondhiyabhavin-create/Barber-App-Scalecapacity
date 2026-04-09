import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/profile";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ModeToggle } from "@/components/mode-toggle";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function OnboardingPage() {
  const { user, profile, tenant } = await getSessionProfile();
  const devRoleSwitcherOn =
    process.env.NEXT_PUBLIC_ENABLE_DEV_ROLE_SWITCHER === "true" ||
    (process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_ENABLE_DEV_ROLE_SWITCHER !== "false");

  if (!user) {
    redirect("/login");
  }

  if (tenant?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className={cn("app-page", devRoleSwitcherOn && "pb-28")}>
      <div className="pointer-events-none absolute inset-0 app-grid opacity-[0.35] dark:opacity-[0.3]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />

      <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-10">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25 transition group-hover:bg-primary/25">
            <Sparkles className="size-4" />
          </span>
          <span className="text-gradient-accent">BarberOS</span>
        </Link>
        <ModeToggle />
      </header>

      <OnboardingWizard hasProfile={!!profile} />
    </div>
  );
}
