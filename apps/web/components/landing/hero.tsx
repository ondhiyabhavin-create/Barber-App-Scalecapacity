"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingHero() {
  return (
    <div className="app-page">
      <div className="pointer-events-none absolute inset-0 app-grid opacity-[0.4] dark:opacity-[0.35]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />

      <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-10">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 text-primary ring-1 ring-primary/25 transition group-hover:from-primary/30 group-hover:to-accent/25">
            <Sparkles className="size-5" />
          </span>
          <span className="text-gradient-accent">BarberOS</span>
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl border-border/80")}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-xl shadow-lg shadow-primary/20"
            )}
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pb-28 pt-10 text-center md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-md"
        >
          <Zap className="size-3.5 text-primary" />
          Multi-tenant · Realtime · White-label
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05, ease }}
          className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl md:leading-[1.08]"
        >
          <span className="text-gradient">The operating system</span>
          <br />
          <span className="text-gradient-accent">for modern barbershops</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease }}
          className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
        >
          Onboarding, live calendar, CRM, and public booking — all in one
          tenant-isolated workspace. Built for teams who want software that
          feels as sharp as the cut.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: "lg" }),
              "group h-12 rounded-xl px-8 text-base font-semibold shadow-xl shadow-primary/25"
            )}
          >
            Start free
            <ArrowRight className="ml-2 size-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "h-12 rounded-xl border-border/80 px-8 text-base backdrop-blur-sm"
            )}
          >
            I have an account
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-20 grid w-full max-w-3xl grid-cols-3 gap-4 text-center md:gap-8"
        >
          {[
            { label: "RLS isolation", sub: "Per tenant" },
            { label: "Realtime", sub: "Live calendar" },
            { label: "Public booking", sub: "Shareable link" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              className="rounded-2xl border border-border/50 bg-card/40 px-3 py-4 backdrop-blur-sm md:px-4"
            >
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
