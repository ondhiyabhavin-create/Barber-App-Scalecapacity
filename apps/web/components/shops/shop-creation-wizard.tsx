"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/shared/emoji-picker";
import { toast } from "sonner";
import { slugifyName } from "@/lib/slug";

const steps = ["Basic", "Brand", "Location", "Geo", "Operations", "Review"] as const;

export function ShopCreationWizard({ ownerUserId }: { ownerUserId: string }) {
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

  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1);
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
    const slugFinal = slug.trim() || slugifyName(shopName);
    setSaving(true);
    const { error } = await supabase.from("tenants").insert({
      name: shopName,
      slug: slugFinal,
      business_type: businessType,
      icon_emoji: emoji,
      logo_url: logoUrl.trim() || null,
      address_line: addressLine.trim() || null,
      country: country.trim() || null,
      region: region.trim() || null,
      city: city.trim() || null,
      postal_code: postalCode.trim() || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      owner_user_id: ownerUserId,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
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
            <Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
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
            <Input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <div className="space-y-2"><Label>Address</Label><Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
            <div className="space-y-2"><Label>Region/State</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div className="space-y-2"><Label>Postal code</Label><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Latitude</Label><Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 23.0225" /></div>
          <div className="space-y-2"><Label>Longitude</Label><Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 72.5714" /></div>
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
