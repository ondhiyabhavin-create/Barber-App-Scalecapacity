"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Pencil, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AppCard } from "@/components/shared/app-card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartAvatar } from "@/components/shared/smart-avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmojiPicker } from "@/components/shared/emoji-picker";
import { toast } from "sonner";

export type ManagedShop = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  region: string | null;
  country: string | null;
  logo_url: string | null;
  icon_emoji: string | null;
  is_active: boolean;
  archived_at: string | null;
};

export function ShopsManager({ initialShops }: { initialShops: ManagedShop[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [shops, setShops] = useState(initialShops);
  const [editing, setEditing] = useState<ManagedShop | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [emoji, setEmoji] = useState("💈");

  function openEdit(shop: ManagedShop) {
    setEditing(shop);
    setName(shop.name);
    setCity(shop.city ?? "");
    setRegion(shop.region ?? "");
    setCountry(shop.country ?? "");
    setEmoji(shop.icon_emoji ?? "💈");
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({
        name: name.trim(),
        city: city.trim() || null,
        region: region.trim() || null,
        country: country.trim() || null,
        icon_emoji: emoji,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setShops((prev) =>
      prev.map((s) =>
        s.id === editing.id
          ? { ...s, name: name.trim(), city: city.trim() || null, region: region.trim() || null, country: country.trim() || null, icon_emoji: emoji }
          : s
      )
    );
    toast.success("Shop updated");
    setEditing(null);
  }

  async function toggleArchive(shop: ManagedShop) {
    const nextActive = !shop.is_active;
    const { error } = await supabase
      .from("tenants")
      .update({
        is_active: nextActive,
        archived_at: nextActive ? null : new Date().toISOString(),
      })
      .eq("id", shop.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setShops((prev) =>
      prev.map((s) =>
        s.id === shop.id
          ? { ...s, is_active: nextActive, archived_at: nextActive ? null : new Date().toISOString() }
          : s
      )
    );
    toast.success(nextActive ? "Shop reactivated" : "Shop archived");
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shops.map((shop) => (
          <AppCard key={shop.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <SmartAvatar name={shop.name} src={shop.logo_url} emoji={shop.icon_emoji} />
                <span>{shop.name}</span>
              </CardTitle>
              <CardDescription>{shop.city ?? "Unknown city"}, {shop.region ?? "-"}, {shop.country ?? "-"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">/{shop.slug}</p>
              <p>{shop.is_active ? "Active" : "Inactive"} {shop.archived_at ? "• Archived" : ""}</p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/book/${shop.slug}`} className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
                  Preview
                </Link>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => openEdit(shop)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => void toggleArchive(shop)}>
                  <Archive className="mr-2 size-4" />
                  {shop.is_active ? "Archive" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </AppCard>
        ))}
      </div>
      {shops.length === 0 ? (
        <AppCard className="p-10 text-center">
          <Store className="mx-auto mb-3 size-8 text-primary" />
          <h3 className="font-heading text-xl font-semibold">No shops yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Create your first shop to start location-based discovery.</p>
        </AppCard>
      ) : null}

      <Dialog open={!!editing} onOpenChange={(open) => (!open ? setEditing(null) : null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Shop emoji</Label>
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="button" className="rounded-xl" onClick={() => void saveEdit()} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
