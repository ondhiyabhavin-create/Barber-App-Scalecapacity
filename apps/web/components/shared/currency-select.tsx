"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function currencyLabel(code: string) {
  try {
    const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(code);
    const sample = new Intl.NumberFormat("en", { style: "currency", currency: code }).format(1);
    return `${code} - ${name ?? code} (${sample.replace(/[0-9.,\s]/g, "") || code})`;
  } catch {
    return code;
  }
}

export function CurrencySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const supported =
      typeof Intl !== "undefined" && "supportedValuesOf" in Intl
        ? (Intl.supportedValuesOf("currency") as string[])
        : ["USD", "EUR", "GBP", "CAD", "INR", "AUD", "AED", "JPY"];
    return supported.map((code) => ({ code, label: currencyLabel(code) }));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options.slice(0, 200);
    return options.filter(
      (o) => o.code.toLowerCase().includes(needle) || o.label.toLowerCase().includes(needle)
    );
  }, [options, query]);

  const selected = options.find((o) => o.code === value);

  return (
    <>
      <Button type="button" variant="outline" className="h-11 w-full justify-between rounded-xl" onClick={() => setOpen(true)}>
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Select currency</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Search currency code or name" />
            </div>
            <div className="max-h-72 space-y-1 overflow-auto rounded-xl border border-border/60 p-1">
              {filtered.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    onChange(item.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                    item.code === value && "bg-primary/10 text-primary"
                  )}
                >
                  <span>{item.label}</span>
                  {item.code === value ? <Check className="size-4" /> : null}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
