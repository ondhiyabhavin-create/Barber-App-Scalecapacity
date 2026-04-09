import Link from "next/link";
import { redirect } from "next/navigation";
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
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,168,76,0.1),_transparent_55%)]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-heading text-lg font-semibold">
          BarberOS
        </Link>
        <ModeToggle />
      </header>
      <div className="relative z-10 flex justify-center px-4 pb-16 pt-8">
        <SignupForm />
      </div>
    </div>
  );
}
