"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { CurrencySelect } from "@/components/shared/currency-select";
import { DurationPresetPicker } from "@/components/shared/duration-preset-picker";

export type ServiceRow = {
  id: string;
  tenant_id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  currency_code?: string;
  category: string | null;
  created_at: string;
};

type Props = { tenantId: string };

export function ServicesManager({ tenantId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [priceUsd, setPriceUsd] = useState("25");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [customDuration, setCustomDuration] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data as ServiceRow[]) ?? []);
  }, [supabase, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setName("New service");
    setDurationMin(30);
    setPriceUsd("30");
    setCurrencyCode("USD");
    setCustomDuration("");
    setDialogOpen(true);
  }

  function openEdit(s: ServiceRow) {
    setEditing(s);
    setName(s.name);
    setDurationMin(s.duration_min);
    setCustomDuration(String(s.duration_min));
    setPriceUsd((s.price_cents / 100).toFixed(2));
    setCurrencyCode(s.currency_code || "USD");
    setDialogOpen(true);
  }

  async function save() {
    const n = name.trim();
    if (!n) {
      toast.error("Name is required");
      return;
    }
    const dur = Math.max(1, Math.round(Number(durationMin)) || 0);
    const price = Number.parseFloat(priceUsd.replace(/,/g, ""));
    if (Number.isNaN(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    const price_cents = Math.round(price * 100);
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("services")
        .update({
          name: n,
          duration_min: dur,
          price_cents,
          currency_code: currencyCode,
        })
        .eq("id", editing.id)
        .eq("tenant_id", tenantId);
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Service updated");
    } else {
      const { error } = await supabase.from("services").insert({
        tenant_id: tenantId,
        name: n,
        duration_min: dur,
        price_cents,
        currency_code: currencyCode,
      });
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Service added");
    }
    setDialogOpen(false);
    void load();
  }

  async function remove(s: ServiceRow) {
    if (!confirm(`Delete “${s.name}”? Appointments referencing it may fail.`)) return;
    const { error } = await supabase.from("services").delete().eq("id", s.id).eq("tenant_id", tenantId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Service removed");
    void load();
  }

  function formatPrice(priceCents: number, code: string) {
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency: code }).format(priceCents / 100);
    } catch {
      return `$${(priceCents / 100).toFixed(2)} ${code}`;
    }
  }

  return (
    <>
      <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
        <div className="glass-strong rounded-[15px]">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Service catalog</CardTitle>
              <CardDescription>
                These appear on the public booking page and in calendar when creating
                appointments. <strong className="text-foreground">Owner</strong> (and staff)
                can manage rows via the API; this screen is owner-only.
              </CardDescription>
            </div>
            <Button type="button" className="rounded-xl shadow-md shadow-primary/15" onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add service
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading services…
              </p>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={Plus}
                title="No services yet"
                description="Create your first service to unblock booking and scheduling."
                cta={
                  <Button type="button" className="rounded-xl" onClick={openCreate}>
                    Create your first service
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="p-3">Name</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => (
                      <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">{s.name}</td>
                        <td className="p-3 tabular-nums text-muted-foreground">{s.duration_min} min</td>
                        <td className="p-3 tabular-nums">{formatPrice(s.price_cents, s.currency_code || "USD")}</td>
                        <td className="p-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg"
                            onClick={() => openEdit(s)}
                            aria-label={`Edit ${s.name}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg text-destructive hover:text-destructive"
                            onClick={() => void remove(s)}
                            aria-label={`Delete ${s.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editing ? "Edit service" : "Add service"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Name</Label>
              <Input
                id="svc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-dur">Duration (minutes)</Label>
              <DurationPresetPicker
                value={durationMin}
                onChange={setDurationMin}
                customMinutes={customDuration}
                onCustomMinutesChange={setCustomDuration}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Currency</Label>
                <CurrencySelect value={currencyCode} onChange={setCurrencyCode} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-price">Price</Label>
                <Input
                  id="svc-price"
                  inputMode="decimal"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="e.g. 45.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" disabled={saving} onClick={() => void save()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
