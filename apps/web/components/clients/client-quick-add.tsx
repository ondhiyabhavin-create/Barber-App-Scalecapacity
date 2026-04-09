"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SmartAvatar } from "@/components/shared/smart-avatar";
import { CountryCodeSelect } from "@/components/shared/country-code-select";

function emailOk(e: string) {
  if (!e.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

function phoneOk(p: string) {
  if (!p.trim()) return true;
  return /^[\d\s+().-]{7,}$/.test(p.trim());
}

export function ClientQuickAdd({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [moreDetails, setMoreDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => {
      const el = document.getElementById("client-add-name");
      el?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [open]);

  const fullPhone = `${countryCode.trim()} ${phone.trim()}`.trim();
  const valid = name.trim().length > 0 && emailOk(email) && phoneOk(fullPhone);

  async function save() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!emailOk(email)) {
      toast.error("Enter a valid email or leave it blank");
      return;
    }
    if (!phoneOk(fullPhone)) {
      toast.error("Enter a valid phone or leave it blank");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const tagList = tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { error } = await supabase.from("clients").insert({
      tenant_id: tenantId,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim()
        ? `${countryCode.trim()} ${phone.trim()}`.trim()
        : null,
      haircut_notes: notes.trim() || null,
      tags: tagList.length ? tagList : [],
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Client added");
    setOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setCountryCode("+1");
    setNotes("");
    setTags("");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground [a]:hover:bg-primary/80"
      >
        Add client
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex size-full max-w-full flex-col gap-0 p-0 sm:max-w-md"
        showCloseButton
      >
        <SheetHeader className="border-b border-border/50 p-4 text-left">
          <SheetTitle className="font-heading text-xl">Add client</SheetTitle>
          <SheetDescription>
            Identity and optional preferences. Save is enabled when the form is valid.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Identity
            </p>
            <div className="space-y-2">
              <Label htmlFor="client-add-name">Name</Label>
              <Input
                id="client-add-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
                autoComplete="name"
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-add-email">Email</Label>
              <Input
                id="client-add-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
                autoComplete="email"
                placeholder="name@example.com"
              />
              {email && !emailOk(email) ? (
                <p className="text-xs text-destructive">Invalid email format</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-add-phone">Phone</Label>
              <div className="flex gap-2">
                <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                <Input
                  id="client-add-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl"
                  autoComplete="tel"
                  placeholder="555 555 1234"
                />
              </div>
              {phone && !phoneOk(fullPhone) ? (
                <p className="text-xs text-destructive">Invalid phone format</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Avatar preview</p>
              <div className="flex items-center gap-3">
                <SmartAvatar name={name || "New client"} />
                <p className="text-sm text-muted-foreground">Auto-generated initials + color.</p>
              </div>
            </div>
          </section>
          <Separator />
          <section className="space-y-4">
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              onClick={() => setMoreDetails((v) => !v)}
            >
              {moreDetails ? "Hide more details" : "More details"}
            </button>
            {moreDetails ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="client-add-notes">Notes</Label>
                  <Input
                    id="client-add-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-11 rounded-xl"
                    placeholder="e.g. prefers short sides"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-add-tags">Tags</Label>
                  <Input
                    id="client-add-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="h-11 rounded-xl"
                    placeholder="e.g. VIP, regular (comma-separated)"
                  />
                </div>
              </>
            ) : null}
          </section>
        </div>
        <div className="flex shrink-0 gap-2 border-t border-border/50 p-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl shadow-md shadow-primary/15"
            disabled={!valid || loading}
            onClick={() => void save()}
          >
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
