"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";

export function LandingHero() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,168,76,0.12),_transparent_55%)]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <span className="font-heading text-xl font-semibold tracking-tight text-foreground">
          BarberOS
        </span>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Sign in
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
            Get started
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-24 pt-16 text-center md:pt-24">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 rounded-full border border-border/80 bg-card/60 px-4 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground backdrop-blur"
        >
          Multi-tenant · Realtime · White-label
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl"
        >
          The operating system for modern barbershops
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Onboarding, live calendar, CRM, public booking, and a cinematic client
          experience — powered by Supabase with tenant isolation via RLS.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
            Start free
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            I already have an account
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
