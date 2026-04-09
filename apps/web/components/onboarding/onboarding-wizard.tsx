"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BUSINESS_TYPES } from "@barberos/shared";

const steps = ["Business", "Location", "Brand", "Services"];

type Props = {
  hasProfile: boolean;
};

export function OnboardingWizard({ hasProfile }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(hasProfile ? 1 : 0);
  const [loading, setLoading] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState<string>("barbershop");

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [serviceName, setServiceName] = useState("Signature cut");
  const [durationMin, setDurationMin] = useState(30);
  const [price, setPrice] = useState(45);

  const progress = ((step + 1) / steps.length) * 100;

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
    setLoading(true);
    const finalSlug = slug.trim() || slugify(businessName);
    const { error } = await supabase.rpc("bootstrap_owner_shop", {
      p_name: businessName.trim(),
      p_slug: finalSlug,
      p_business_type: businessType,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
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

  async function finish() {
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

    const { error: doneErr } = await supabase
      .from("tenants")
      .update({ onboarding_completed: true })
      .eq("id", tenantId);
    setLoading(false);
    if (doneErr) {
      toast.error(doneErr.message);
      return;
    }
    toast.success("You're live");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10">
      <div className="mb-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Onboarding
        </p>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-3xl font-semibold">Set up BarberOS</h1>
          <span className="text-sm text-muted-foreground">
            Step {step + 1} / {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex gap-2 text-xs text-muted-foreground">
          {steps.map((label, i) => (
            <span
              key={label}
              className={i === step ? "text-primary" : i < step ? "text-foreground" : ""}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
          className="glass-panel flex flex-1 flex-col gap-6 rounded-2xl p-8"
        >
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="biz">Business name</Label>
                <Input
                  id="biz"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Northside Barbers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="northside-barbers"
                />
                <p className="text-xs text-muted-foreground">
                  Your booking link will be <span className="text-primary">/book/your-slug</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Business type</Label>
                <Select
                  value={businessType}
                  onValueChange={(v) => v && setBusinessType(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleBootstrap} disabled={loading}>
                {loading ? "Creating…" : "Continue"}
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input value={region} onChange={(e) => setRegion(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Postal code</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} disabled={loading}>
                  Back
                </Button>
                <Button className="flex-1" onClick={saveLocation} disabled={loading}>
                  {loading ? "Saving…" : "Continue"}
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo (optional)</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Stored in Supabase Storage — public URL on your shop page.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                  Back
                </Button>
                <Button className="flex-1" onClick={saveLogo} disabled={loading}>
                  {loading ? "Uploading…" : "Continue"}
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>First service</Label>
                <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                  Back
                </Button>
                <Button className="flex-1" onClick={finish} disabled={loading}>
                  {loading ? "Finishing…" : "Go live"}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
