"use client";

import { useMemo, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/shared/emoji-picker";
import { EntitySelect } from "@/components/ui/entity-select";
import { toast } from "sonner";
import { slugifyName } from "@/lib/slug";

const steps = ["Basic", "Brand", "Location", "Geo", "Operations", "Review"] as const;
const BUSINESS_TYPES = [
  { value: "barbershop", label: "Barbershop" },
  { value: "salon", label: "Salon" },
  { value: "mobile_barber", label: "Mobile barber" },
  { value: "studio", label: "Studio" },
  { value: "other", label: "Other" },
];
const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "IN", label: "India" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "AE", label: "United Arab Emirates" },
];
const REGION_OPTIONS: Record<string, { value: string; label: string }[]> = {
  US: [
    { value: "California", label: "California" },
    { value: "New York", label: "New York" },
    { value: "Texas", label: "Texas" },
    { value: "Florida", label: "Florida" },
  ],
  IN: [
    { value: "Gujarat", label: "Gujarat" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Delhi", label: "Delhi" },
    { value: "Karnataka", label: "Karnataka" },
  ],
  GB: [
    { value: "England", label: "England" },
    { value: "Scotland", label: "Scotland" },
    { value: "Wales", label: "Wales" },
    { value: "Northern Ireland", label: "Northern Ireland" },
  ],
};

export function ShopCreationWizard() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState("barbershop");
  const [emoji, setEmoji] = useState("💈");
  const [logoUrl, setLogoUrl] = useState("");
  const [themeColor, setThemeColor] = useState("#0284c7");
  const [addressLine, setAddressLine] = useState("");
  const [country, setCountry] = useState("US");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [notes, setNotes] = useState("");

  const latNum = latitude ? Number(latitude) : NaN;
  const lonNum = longitude ? Number(longitude) : NaN;
  const hasCoords = Number.isFinite(latNum) && Number.isFinite(lonNum);

  function next() {
    if (step === 0) {
      if (!name.trim()) {
        toast.error("Shop name is required");
        return;
      }
      if (!(slug.trim() || slugifyName(name).trim())) {
        toast.error("Slug is required");
        return;
      }
    }
    if (step === 2) {
      if (!country) {
        toast.error("Select country");
        return;
      }
      if (!city.trim()) {
        toast.error("City is required");
        return;
      }
    }
    if (step < steps.length - 1) setStep((s) => s + 1);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        toast.success("Location filled from device");
      },
      () => toast.error("Could not access location")
    );
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function save() {
    const shopName = name.trim();
    if (!shopName) {
      toast.error("Shop name is required");
      return;
    }
    if (!country) {
      toast.error("Country is required");
      return;
    }
    const slugFinal = slug.trim() || slugifyName(shopName);
    setSaving(true);
    const { error } = await supabase.rpc("create_owner_shop", {
      p_name: shopName,
      p_slug: slugFinal,
      p_business_type: businessType,
      p_icon_emoji: emoji,
      p_logo_url: logoUrl.trim() || null,
      p_address_line: addressLine.trim() || null,
      p_country: country || null,
      p_region: region.trim() || null,
      p_city: city.trim() || null,
      p_postal_code: postalCode.trim() || null,
      p_latitude: latitude ? Number(latitude) : null,
      p_longitude: longitude ? Number(longitude) : null,
    });
    setSaving(false);
    if (error) {
      if (error.message.includes("Slug already taken")) toast.error("This shop URL is already taken. Try a different slug.");
      else if (error.message.includes("Only owners")) toast.error("Only owner accounts can create shops.");
      else toast.error(error.message);
      return;
    }
    toast.success("Shop created");
    router.push("/dashboard/shops");
    router.refresh();
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <div
            key={label}
            className={`rounded-full px-3 py-1 text-xs ${index <= step ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {index + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Shop name</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setSlug(slugifyName(e.target.value)); }} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Business type</Label>
            <EntitySelect
              ready
              value={businessType}
              onValueChange={setBusinessType}
              options={BUSINESS_TYPES}
              placeholder="Select business type"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Emoji icon</Label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          <div className="space-y-2">
            <Label>Logo URL (optional)</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Theme color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
                aria-label="Theme color"
              />
              <Input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="h-11" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <div className="space-y-2"><Label>Address</Label><Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Country</Label>
              <EntitySelect
                ready
                value={country}
                onValueChange={(v) => {
                  setCountry(v);
                  setRegion("");
                }}
                options={COUNTRY_OPTIONS}
                placeholder="Select country"
              />
            </div>
            <div className="space-y-2">
              <Label>Region/State</Label>
              {REGION_OPTIONS[country]?.length ? (
                <EntitySelect
                  ready
                  value={region || undefined}
                  onValueChange={setRegion}
                  options={REGION_OPTIONS[country]}
                  placeholder="Select region"
                />
              ) : (
                <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Enter region/state" />
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div className="space-y-2"><Label>Postal code</Label><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={useMyLocation} className="rounded-xl">
              <LocateFixed className="mr-2 size-4" />
              Use my location
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Latitude</Label><Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 23.0225" /></div>
            <div className="space-y-2"><Label>Longitude</Label><Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 72.5714" /></div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <MapPin className="size-3.5" />
              Map preview
            </p>
            {hasCoords ? (
              <iframe
                title="Shop location map preview"
                className="h-56 w-full rounded-xl border border-border/60"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lonNum - 0.01}%2C${latNum - 0.01}%2C${lonNum + 0.01}%2C${latNum + 0.01}&layer=mapnik&marker=${latNum}%2C${lonNum}`}
              />
            ) : (
              <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
                Add coordinates or use device location to preview map.
              </div>
            )}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-2">
          <Label>Operations notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Working hours, booking rules, staff assignment notes..." />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-2 text-sm">
          <p><strong>Shop:</strong> {name || "-"}</p>
          <p><strong>Slug:</strong> {slug || "-"}</p>
          <p><strong>Location:</strong> {city || "-"}, {region || "-"}, {country || "-"}</p>
          <p><strong>Emoji:</strong> {emoji}</p>
          <p><strong>Coordinates:</strong> {latitude || "-"}, {longitude || "-"}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={back} disabled={step === 0}>Back</Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={next}>Continue</Button>
        ) : (
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Creating..." : "Create shop"}
          </Button>
        )}
      </div>
    </div>
  );
}
