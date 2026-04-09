"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { slugifyName, slugWithCollisionSuffix } from "@/lib/slug";
import { seedTenantDemoData } from "@/lib/onboarding/seed-demo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BUSINESS_TYPES } from "@barberos/shared";
import {
  Building2,
  MapPin,
  ImageIcon,
  Scissors,
  Store,
  Truck,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  Link2,
  Clock,
  DollarSign,
  Upload,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const stepMeta: {
  id: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}[] = [
  {
    id: 0,
    title: "Business",
    subtitle: "Name your shop — booking link is set automatically from it",
    icon: Building2,
  },
  {
    id: 1,
    title: "Location",
    subtitle: "Where clients find you",
    icon: MapPin,
  },
  {
    id: 2,
    title: "Brand",
    subtitle: "Logo & visual identity",
    icon: ImageIcon,
  },
  {
    id: 3,
    title: "Services",
    subtitle: "Your first service & pricing",
    icon: Scissors,
  },
  {
    id: 4,
    title: "Preview",
    subtitle: "Add your first barber and preview booking",
    icon: Sparkles,
  },
];

const typeConfig: Record<
  string,
  { label: string; description: string; icon: LucideIcon }
> = {
  barbershop: {
    label: "Barbershop",
    description: "Cuts, fades & beard work",
    icon: Scissors,
  },
  salon: {
    label: "Salon",
    description: "Full-service hair & styling",
    icon: Sparkles,
  },
  mobile_barber: {
    label: "Mobile",
    description: "On-location appointments",
    icon: Truck,
  },
};

type Props = {
  hasProfile: boolean;
};

export function OnboardingWizard({ hasProfile }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(hasProfile ? 1 : 0);
  const [loading, setLoading] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<string>("barbershop");

  const bookingSlugPreview = useMemo(
    () => slugifyName(businessName),
    [businessName]
  );

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [serviceName, setServiceName] = useState("Signature cut");
  const [durationMin, setDurationMin] = useState(30);
  const [price, setPrice] = useState(45);
  const [barberName, setBarberName] = useState("Lead Barber");
  const [seedDemo, setSeedDemo] = useState(true);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  async function ensureTenantId(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    return profile?.tenant_id ?? null;
  }

  async function handleBootstrap() {
    if (!businessName.trim()) {
      toast.error("Add your business name");
      return;
    }
    const existingTenantId = await ensureTenantId();
    if (existingTenantId) {
      // Workspace already created (e.g. user returned to step 1 from "Back")
      setStep(1);
      return;
    }
    const baseSlug = slugifyName(businessName);
    setLoading(true);
    let usedSlug: string | null = null;

    for (let attempt = 1; attempt <= 40; attempt++) {
      const candidate = slugWithCollisionSuffix(baseSlug, attempt);
      const { error } = await supabase.rpc("bootstrap_owner_shop", {
        p_name: businessName.trim(),
        p_slug: candidate,
        p_business_type: businessType,
      });
      if (!error) {
        usedSlug = candidate;
        break;
      }
      const msg = error.message ?? "";
      if (msg.includes("Slug already taken")) {
        continue;
      }
      if (msg.includes("Profile already exists")) {
        // RLS may hide public.users from the client; RPC still sees the row — advance.
        setLoading(false);
        router.refresh();
        setStep(1);
        return;
      }
      setLoading(false);
      toast.error(error.message);
      return;
    }

    setLoading(false);
    if (usedSlug === null) {
      toast.error(
        "Could not reserve a booking link. Try a slightly different business name."
      );
      return;
    }

    if (usedSlug !== baseSlug) {
      toast.message("Booking link assigned", {
        description: `“${baseSlug}” was taken — your page is /book/${usedSlug}`,
      });
    }
    toast.success("Workspace created");
    router.refresh();
    setStep(1);
  }

  async function saveLocation() {
    const tenantId = await ensureTenantId();
    if (!tenantId) {
      toast.error("Missing tenant");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("tenants")
      .update({
        address_line: addressLine || null,
        city: city || null,
        region: region || null,
        postal_code: postalCode || null,
      })
      .eq("id", tenantId);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStep(2);
  }

  async function saveLogo() {
    const tenantId = await ensureTenantId();
    if (!tenantId) {
      toast.error("Missing tenant");
      return;
    }
    if (!logoFile) {
      setStep(3);
      return;
    }
    setLoading(true);
    const ext = logoFile.name.split(".").pop() || "png";
    const path = `${tenantId}/logo.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("shop-assets")
      .upload(path, logoFile, { upsert: true });
    if (upErr) {
      setLoading(false);
      toast.error(upErr.message);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("shop-assets").getPublicUrl(path);
    const { error } = await supabase
      .from("tenants")
      .update({ logo_url: publicUrl })
      .eq("id", tenantId);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStep(3);
  }

  async function saveService() {
    const tenantId = await ensureTenantId();
    if (!tenantId) {
      toast.error("Missing tenant");
      return;
    }
    setLoading(true);
    const { error: svcErr } = await supabase.from("services").insert({
      tenant_id: tenantId,
      name: serviceName.trim(),
      duration_min: durationMin,
      price_cents: Math.round(price * 100),
      category: "Haircut",
    });
    if (svcErr) {
      setLoading(false);
      toast.error(svcErr.message);
      return;
    }

    const { data: barbers } = await supabase
      .from("barbers")
      .select("id")
      .eq("tenant_id", tenantId);

    if (barbers?.length) {
      for (const b of barbers) {
        const { count } = await supabase
          .from("working_hours")
          .select("*", { count: "exact", head: true })
          .eq("barber_id", b.id);
        if (count && count > 0) continue;
        for (const day of [1, 2, 3, 4, 5]) {
          await supabase.from("working_hours").insert({
            barber_id: b.id,
            day_of_week: day,
            start_time: "09:00:00",
            end_time: "17:00:00",
          });
        }
      }
    }

    setLoading(false);
    setStep(4);
  }

  async function finish() {
    const tenantId = await ensureTenantId();
    if (!tenantId) {
      toast.error("Missing tenant");
      return;
    }
    setLoading(true);
    const { data: barber, error: barberErr } = await supabase
      .from("barbers")
      .insert({ tenant_id: tenantId, display_name: barberName.trim() || "Lead Barber" })
      .select("id")
      .single();
    if (barberErr) {
      setLoading(false);
      toast.error(barberErr.message);
      return;
    }
    for (const day of [1, 2, 3, 4, 5]) {
      await supabase.from("working_hours").insert({
        barber_id: barber.id,
        day_of_week: day,
        start_time: "09:00:00",
        end_time: "17:00:00",
      });
    }
    if (seedDemo) {
      try {
        await seedTenantDemoData(supabase, tenantId, barber.id);
      } catch (error) {
        console.error(error);
      }
    }
    const { error: doneErr } = await supabase.from("tenants").update({ onboarding_completed: true }).eq("id", tenantId);
    setLoading(false);
    if (doneErr) {
      toast.error(doneErr.message);
      return;
    }
    toast.success("You're live");
    router.push("/dashboard");
    router.refresh();
  }

  const stepInfo = stepMeta[step]!;
  const StepHeroIcon = stepInfo.icon;

  return (
    <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col gap-8 px-4 pb-16 pt-4 md:flex-row md:gap-12 md:px-8 lg:pt-8">
      {/* Left column — narrative + stepper */}
      <aside className="flex w-full flex-shrink-0 flex-col md:sticky md:top-8 md:max-w-sm md:self-start">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/90">
            Partner onboarding
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Build your
            <span className="block bg-gradient-to-r from-foreground via-foreground to-primary/90 bg-clip-text text-transparent">
              branded workspace
            </span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A few polished steps — then your live booking link, calendar, and
            CRM. Designed to feel as premium as your chair.
          </p>
        </motion.div>

        <nav className="mt-10 hidden md:block" aria-label="Steps">
          <ol className="relative space-y-0">
            {stepMeta.map((s, i) => {
              const done = i < step;
              const active = i === step;
              const Icon = s.icon;
              return (
                <li key={s.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < stepMeta.length - 1 && (
                    <div
                      className="absolute left-[18px] top-10 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-border to-transparent"
                      aria-hidden
                    />
                  )}
                  <motion.div
                    initial={false}
                    animate={{
                      scale: active ? 1.06 : 1,
                      opacity: active || done ? 1 : 0.45,
                    }}
                    className={cn(
                      "relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                      done &&
                        "border-primary/50 bg-primary/20 text-primary shadow-lg shadow-primary/30",
                      active &&
                        !done &&
                        "border-primary/50 bg-primary/20 text-primary ring-2 ring-primary/25",
                      !active &&
                        !done &&
                        "border-border/80 bg-card/40 text-muted-foreground"
                    )}
                  >
                    {done ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </motion.div>
                  <div className="min-w-0 pt-0.5">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {s.title}
                    </p>
                    <p className="text-xs leading-snug text-muted-foreground/90">
                      {s.subtitle}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Mobile step dots */}
        <div className="mt-8 flex justify-center gap-2 md:hidden">
          {stepMeta.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Step ${i + 1}`}
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === step
                  ? "w-8 bg-primary"
                  : i < step
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted-foreground/25"
              )}
            />
          ))}
        </div>
      </aside>

      {/* Right column — form card */}
      <div className="min-w-0 flex-1">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="mb-4 flex items-center gap-3 md:hidden"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <StepHeroIcon className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Step {step + 1} / {stepMeta.length}
            </p>
            <p className="font-heading text-lg font-semibold">{stepInfo.title}</p>
          </div>
        </motion.div>

        <div className="shine-border rounded-3xl">
          <div className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/5 blur-2xl" />

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -16, filter: "blur(6px)" }}
                transition={{ duration: 0.35, ease }}
                className="relative min-h-[320px]"
              >
                <div className="mb-8 hidden border-b border-border/50 pb-6 md:block">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Step {step + 1} of {stepMeta.length}
                      </p>
                      <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
                        {stepInfo.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {stepInfo.subtitle}
                      </p>
                    </div>
                    <div className="hidden rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20 sm:block">
                      <StepHeroIcon className="size-6" />
                    </div>
                  </div>
                </div>

                {step === 0 && (
                  <div className="space-y-6">
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <Label
                        htmlFor="biz"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Business name
                      </Label>
                      <Input
                        id="biz"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Northside Barbers"
                        className="h-12 rounded-xl border-border/60 bg-background/60 text-base transition focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Your booking link
                      </p>
                      <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 ring-1 ring-border/40">
                        <span className="shrink-0 text-xs text-muted-foreground">
                          /book/
                        </span>
                        <span
                          className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-foreground"
                          title={bookingSlugPreview}
                        >
                          {businessName.trim() ? bookingSlugPreview : "your-shop-name"}
                        </span>
                      </div>
                      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                        <Link2 className="mt-0.5 size-3.5 shrink-0 text-primary/80" />
                        Generated from your business name. If that address is already taken,
                        we assign the next free one (e.g.{" "}
                        <span className="font-mono text-foreground/90">
                          {bookingSlugPreview}-2
                        </span>
                        ). You don&apos;t need to edit it.
                      </p>
                    </motion.div>

                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Business type
                      </Label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {BUSINESS_TYPES.map((t, idx) => {
                          const cfg = typeConfig[t] ?? {
                            label: t,
                            description: "",
                            icon: Store,
                          };
                          const Icon = cfg.icon;
                          const selected = businessType === t;
                          return (
                            <motion.button
                              key={t}
                              type="button"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.12 + idx * 0.05 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setBusinessType(t)}
                              className={cn(
                                "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                                selected
                                  ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_38%,transparent)] ring-2 ring-primary/20"
                                  : "border-border/60 bg-background/30 hover:border-border hover:bg-background/50"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "size-5",
                                  selected ? "text-primary" : "text-muted-foreground"
                                )}
                              />
                              <span className="text-sm font-semibold">
                                {cfg.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {cfg.description}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <motion.div
                      className="pt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      <Button
                        className="group h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/15 transition hover:shadow-xl hover:shadow-primary/20"
                        onClick={handleBootstrap}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Creating workspace…
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-2 size-4 transition group-hover:translate-x-0.5" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Street address
                      </Label>
                      <Input
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="123 Main St"
                        className="h-12 rounded-xl border-border/60 bg-background/60"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          City
                        </Label>
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="h-12 rounded-xl border-border/60 bg-background/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Region / State
                        </Label>
                        <Input
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="h-12 rounded-xl border-border/60 bg-background/60"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Postal code
                      </Label>
                      <Input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="h-12 rounded-xl border-border/60 bg-background/60"
                      />
                    </div>
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="h-12 rounded-xl border-border/60"
                        onClick={() => setStep(0)}
                        disabled={loading}
                      >
                        <ArrowLeft className="mr-2 size-4" />
                        Back
                      </Button>
                      <Button
                        className="h-12 flex-1 rounded-xl font-semibold shadow-lg shadow-primary/15"
                        onClick={saveLocation}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-2 size-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <label
                      htmlFor="logo"
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 bg-background/30 px-6 py-12 text-center transition hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) =>
                          setLogoFile(e.target.files?.[0] ?? null)
                        }
                      />
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          width={256}
                          height={256}
                          unoptimized
                          className="mb-4 max-h-48 max-w-full rounded-lg object-contain shadow-lg"
                        />
                      ) : (
                        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
                          <Upload className="size-7" />
                        </div>
                      )}
                      <span className="font-medium">
                        Drop an image or click to upload
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        PNG or JPG · recommended 512×512
                      </span>
                    </label>
                    <p className="text-center text-xs text-muted-foreground">
                      Stored in Supabase Storage — appears on your public booking
                      page.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        className="h-12 rounded-xl"
                        onClick={() => setStep(1)}
                        disabled={loading}
                      >
                        <ArrowLeft className="mr-2 size-4" />
                        Back
                      </Button>
                      <Button
                        className="h-12 flex-1 rounded-xl font-semibold shadow-lg shadow-primary/15"
                        onClick={saveLogo}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            {logoFile ? "Upload & continue" : "Skip for now"}
                            <ArrowRight className="ml-2 size-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Service name
                      </Label>
                      <Input
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        className="h-12 rounded-xl border-border/60 bg-background/60"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Clock className="size-3.5" />
                          Duration (min)
                        </Label>
                        <Input
                          type="number"
                          min={5}
                          value={durationMin}
                          onChange={(e) =>
                            setDurationMin(Number(e.target.value))
                          }
                          className="h-12 rounded-xl border-border/60 bg-background/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <DollarSign className="size-3.5" />
                          Price (USD)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          className="h-12 rounded-xl border-border/60 bg-background/60"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="h-12 rounded-xl"
                        onClick={() => setStep(2)}
                        disabled={loading}
                      >
                        <ArrowLeft className="mr-2 size-4" />
                        Back
                      </Button>
                      <Button
                        className="h-12 flex-1 rounded-xl font-semibold shadow-lg shadow-primary/15"
                        onClick={saveService}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="mr-2 size-4" />
                            Continue
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        First barber
                      </Label>
                      <Input
                        value={barberName}
                        onChange={(e) => setBarberName(e.target.value)}
                        className="h-12 rounded-xl border-border/60 bg-background/60"
                        placeholder="Lead Barber"
                      />
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
                      <p className="font-medium">Preview booking page</p>
                      <p className="mt-1 text-muted-foreground">
                        Your public booking page will be available after setup completes.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={seedDemo}
                        onChange={(e) => setSeedDemo(e.target.checked)}
                      />
                      Start with demo data (3 clients, 2 services, 2 appointments)
                    </label>
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="h-12 rounded-xl"
                        onClick={() => setStep(3)}
                        disabled={loading}
                      >
                        <ArrowLeft className="mr-2 size-4" />
                        Back
                      </Button>
                      <Button
                        className="h-12 flex-1 rounded-xl font-semibold shadow-lg shadow-primary/15"
                        onClick={finish}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="mr-2 size-4" />
                            Complete setup
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
