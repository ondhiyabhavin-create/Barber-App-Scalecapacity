import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "@/components/auth/signup-form";
import { ModeToggle } from "@/components/mode-toggle";

export default async function SignupPage() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="app-page">
      <div className="pointer-events-none absolute inset-0 app-grid opacity-[0.35] dark:opacity-[0.3]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 text-primary ring-1 ring-primary/25 transition group-hover:from-primary/30 group-hover:to-accent/25">
            <Sparkles className="size-5" />
          </span>
          <span className="text-gradient-accent">BarberOS</span>
        </Link>
        <ModeToggle />
      </header>
      <div className="relative z-10 flex justify-center px-4 pb-20 pt-6 md:pt-10">
        <SignupForm />
      </div>
    </div>
  );
}
