"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMinutes } from "date-fns";

type AppointmentRow = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  clients: { name: string } | { name: string }[] | null;
  services:
    | { name: string; duration_min: number; price_cents: number }
    | { name: string; duration_min: number; price_cents: number }[]
    | null;
  barbers: { display_name: string } | { display_name: string }[] | null;
};

function pickName(c: AppointmentRow["clients"]) {
  if (!c) return undefined;
  if (Array.isArray(c)) return c[0]?.name;
  return c.name;
}

function pickServiceName(s: AppointmentRow["services"]) {
  if (!s) return undefined;
  if (Array.isArray(s)) return s[0]?.name;
  return s.name;
}

type Props = {
  tenantId: string;
};

export function CalendarBoard({ tenantId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [barbers, setBarbers] = useState<{ id: string; display_name: string }[]>(
    []
  );
  const [services, setServices] = useState<
    { id: string; name: string; duration_min: number; price_cents: number }[]
  >([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const [barberId, setBarberId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [startLocal, setStartLocal] = useState("");

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        start_time,
        end_time,
        status,
        clients ( name ),
        services ( name, duration_min, price_cents ),
        barbers ( display_name )
      `
      )
      .eq("tenant_id", tenantId)
      .gte("start_time", weekStart.toISOString())
      .lte("start_time", weekEnd.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      toast.error(error.message);
    } else {
      setRows((data as unknown as AppointmentRow[]) ?? []);
    }
    setLoading(false);
  }, [supabase, tenantId, weekStart, weekEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`appointments-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, tenantId, load]);

  useEffect(() => {
    void (async () => {
      const [{ data: b }, { data: s }, { data: c }] = await Promise.all([
        supabase.from("barbers").select("id, display_name").eq("tenant_id", tenantId),
        supabase.from("services").select("id, name, duration_min, price_cents").eq("tenant_id", tenantId),
        supabase.from("clients").select("id, name").eq("tenant_id", tenantId).limit(200),
      ]);
      setBarbers(b ?? []);
      setServices(s ?? []);
      setClients(c ?? []);
      if (b?.[0]) setBarberId(b[0].id);
      if (s?.[0]) setServiceId(s[0].id);
      if (c?.[0]) setClientId(c[0].id);
    })();
  }, [supabase, tenantId]);

  async function createAppointment() {
    if (!barberId || !serviceId || !clientId || !startLocal) {
      toast.error("Fill all fields");
      return;
    }
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    const start = new Date(startLocal);
    const end = addMinutes(start, svc.duration_min);

    const { count } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("barber_id", barberId)
      .not("status", "eq", "cancelled")
      .lt("start_time", end.toISOString())
      .gt("end_time", start.toISOString());

    if (count && count > 0) {
      toast.error("Overlap detected — pick another time");
      return;
    }

    const { error } = await supabase.from("appointments").insert({
      tenant_id: tenantId,
      client_id: clientId,
      barber_id: barberId,
      service_id: serviceId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "confirmed",
    });

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Appointment created");
    setDialogOpen(false);
    void load();
  }

  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    days.forEach((d) => {
      map.set(format(d, "yyyy-MM-dd"), []);
    });
    rows.forEach((r) => {
      const key = format(new Date(r.start_time), "yyyy-MM-dd");
      if (!map.has(key)) return;
      map.get(key)!.push(r);
    });
    return map;
  }, [rows, days]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((w) => addWeeks(w, -1))}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </Button>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New appointment</Button>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => (
            <Skeleton key={d.toISOString()} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const list = grouped.get(key) ?? [];
            return (
              <Card key={key} className="glass-panel border-border/60 bg-card/50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {format(d, "EEE")}
                </p>
                <p className="mb-3 font-heading text-lg">{format(d, "d")}</p>
                <ScrollArea className="h-64 pr-2">
                  <div className="space-y-2">
                    {list.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-lg border border-border/60 bg-background/60 p-2 text-xs"
                      >
                        <p className="font-medium">
                          {format(new Date(a.start_time), "HH:mm")}
                        </p>
                        <p className="text-muted-foreground">
                          {pickName(a.clients) ?? "Client"}
                        </p>
                        <p className="text-muted-foreground">
                          {pickServiceName(a.services) ?? "Service"}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Barber</Label>
              <Select value={barberId} onValueChange={(v) => v && setBarberId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select barber" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={serviceId} onValueChange={(v) => v && setServiceId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={(v) => v && setClientId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Start (local)</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createAppointment()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
