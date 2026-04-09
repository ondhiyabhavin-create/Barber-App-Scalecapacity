"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lifetime_value: number | null;
  tags: string[] | null;
  created_at: string;
};

type SortKey = "name" | "email" | "lastVisit" | "ltv";
type SortDir = "asc" | "desc";

const headers: { key: SortKey; label: string; className?: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Contact" },
  { key: "lastVisit", label: "Added" },
  { key: "ltv", label: "LTV", className: "text-right" },
];

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((c) => {
      const tags = (c.tags ?? []).join(" ");
      return (
        c.name.toLowerCase().includes(needle) ||
        (c.email?.toLowerCase().includes(needle) ?? false) ||
        (c.phone?.toLowerCase().includes(needle) ?? false) ||
        tags.toLowerCase().includes(needle)
      );
    });
  }, [clients, q]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "email") {
        const ae = a.email ?? "";
        const be = b.email ?? "";
        cmp = ae.localeCompare(be);
      } else if (sortKey === "ltv") {
        cmp = Number(a.lifetime_value ?? 0) - Number(b.lifetime_value ?? 0);
      } else if (sortKey === "lastVisit") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone, tags…"
          className="h-10 rounded-xl border-border/70 pl-9"
          aria-label="Search clients"
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40 shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {headers.map((h) => (
                <th key={h.key} className={cn("p-3", h.className)}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 gap-1 px-2 font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort(h.key)}
                  >
                    {h.label}
                    {sortKey === h.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="size-3.5" />
                      ) : (
                        <ArrowDown className="size-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-40" />
                    )}
                  </Button>
                </th>
              ))}
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tags
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="p-3 font-medium">
                  <Link href={`/dashboard/clients/${c.id}`} className="text-primary hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">
                  {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="p-3 tabular-nums text-muted-foreground">
                  {formatRelativeDate(c.created_at)}
                </td>
                <td className="p-3 text-right tabular-nums font-medium">
                  ${Number(c.lifetime_value ?? 0).toFixed(0)}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(c.tags ?? []).slice(0, 4).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatRelativeDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
