"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMinutes,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntitySelect } from "@/components/ui/entity-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  /** Staff/owner can create; client role is view-only */
  canCreateAppointment?: boolean;
};

export function CalendarBoard({
  tenantId,
  canCreateAppointment = true,
}: Props) {
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

  /** undefined until options load — avoids Select showing raw UUID when value has no matching item */
  const [barberId, setBarberId] = useState<string | undefined>(undefined);
  const [serviceId, setServiceId] = useState<string | undefined>(undefined);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [startLocal, setStartLocal] = useState("");
  const [pickersReady, setPickersReady] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  // Must be memoized: a new Date() each render would change `load` every time and
  // retrigger effects → infinite appointments fetches + Realtime reconnect storm.
  const weekEnd = useMemo(
    () => endOfWeek(weekStart, { weekStartsOn: 1 }),
    [weekStart]
  );
  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

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
    let cancelled = false;
    setPickersReady(false);
    void (async () => {
      const [{ data: b }, { data: s }, { data: c }] = await Promise.all([
        supabase.from("barbers").select("id, display_name").eq("tenant_id", tenantId),
        supabase.from("services").select("id, name, duration_min, price_cents").eq("tenant_id", tenantId),
        supabase.from("clients").select("id, name").eq("tenant_id", tenantId).limit(200),
      ]);
      if (cancelled) return;
      const bl = b ?? [];
      const sl = s ?? [];
      const cl = c ?? [];
      setBarbers(bl);
      setServices(sl);
      setClients(cl);
      setBarberId(bl[0]?.id);
      setServiceId(sl[0]?.id);
      setClientId(cl[0]?.id);
      setPickersReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, tenantId]);

  async function createAppointment() {
    if (!barberId || !serviceId || !clientId || !startLocal) {
      toast.error("Select barber, service, client, and start time");
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
    setWizardStep(0);
    void load();
  }

  function canContinueWizard() {
    if (!pickersReady) return false;
    if (wizardStep === 0) return Boolean(barberId && barbers.some((b) => b.id === barberId));
    if (wizardStep === 1) return Boolean(serviceId && services.some((s) => s.id === serviceId));
    if (wizardStep === 2) return Boolean(clientId && clients.some((c) => c.id === clientId));
    if (wizardStep === 3) return Boolean(startLocal?.trim());
    return true;
  }

  const barberLabel = barbers.find((b) => b.id === barberId)?.display_name;
  const serviceLabel = services.find((s) => s.id === serviceId);
  const clientLabel = clients.find((c) => c.id === clientId)?.name;

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-border/70"
            onClick={() => setWeekStart((w) => addWeeks(w, -1))}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-border/70"
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </Button>
          <p className="text-sm font-medium tabular-nums text-muted-foreground">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </p>
        </div>
        {canCreateAppointment ? (
          <Button
            className="rounded-xl shadow-lg shadow-primary/15"
            onClick={() => {
              const d = new Date();
              d.setMinutes(0, 0, 0);
              d.setHours(d.getHours() + 1);
              const pad = (n: number) => String(n).padStart(2, "0");
              setStartLocal(
                `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
              );
              setWizardStep(0);
              setDialogOpen(true);
            }}
          >
            New appointment
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            View only — book as a guest on the public page.
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {days.map((d) => (
            <Skeleton key={d.toISOString()} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const list = grouped.get(key) ?? [];
            return (
              <Card
                key={key}
                className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none"
              >
                <div className="glass-strong rounded-[15px] p-3">
                <p
                  className={cn(
                    "mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    isToday(d) && "text-primary"
                  )}
                >
                  {format(d, "EEE")}
                </p>
                <p
                  className={cn(
                    "mb-3 font-heading text-lg tabular-nums",
                    isToday(d) && "text-primary"
                  )}
                >
                  {format(d, "d")}
                </p>
                <ScrollArea className="h-64 pr-2">
                  <div className="space-y-2">
                    {list.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border/50 bg-muted/20 px-2 py-6 text-center text-xs text-muted-foreground">
                        No bookings
                      </p>
                    ) : null}
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
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setWizardStep(0);
        }}
      >
        <SheetContent
          side="right"
          showCloseButton
          className="flex h-full w-full max-w-md flex-col gap-0 border-l border-border/60 p-0 sm:max-w-md"
        >
          <SheetHeader className="shrink-0 space-y-3 border-b border-border/50 p-4 text-left">
            <SheetTitle className="font-heading text-xl">New appointment</SheetTitle>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Step {wizardStep + 1} of 5 · {["Barber", "Service", "Client", "Time", "Confirm"][wizardStep]}
            </p>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i <= wizardStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Times use your device timezone — never shown as raw IDs.
            </p>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {wizardStep === 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Barber
                </Label>
                <EntitySelect
                  ready={pickersReady}
                  value={barberId}
                  onValueChange={setBarberId}
                  options={barbers.map((b) => ({
                    value: b.id,
                    label: b.display_name,
                  }))}
                  placeholder="Select barber"
                  disabled={barbers.length === 0}
                />
              </div>
            )}
            {wizardStep === 1 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Service
                </Label>
                <EntitySelect
                  ready={pickersReady}
                  value={serviceId}
                  onValueChange={setServiceId}
                  options={services.map((s) => ({
                    value: s.id,
                    label: `${s.name} · $${(s.price_cents / 100).toFixed(0)} · ${s.duration_min}m`,
                  }))}
                  placeholder="Select service"
                  disabled={services.length === 0}
                />
              </div>
            )}
            {wizardStep === 2 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Client
                </Label>
                <EntitySelect
                  ready={pickersReady}
                  value={clientId}
                  onValueChange={setClientId}
                  options={clients.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Select client"
                  disabled={clients.length === 0}
                />
              </div>
            )}
            {wizardStep === 3 && (
              <div className="space-y-2">
                <Label htmlFor="start" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Start time
                </Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="h-11 rounded-xl border-border/70 font-mono text-sm"
                />
              </div>
            )}
            {wizardStep === 4 && serviceLabel && (
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Barber</span>
                  <span className="text-right font-medium">{barberLabel ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Service</span>
                  <span className="text-right font-medium">{serviceLabel.name}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Client</span>
                  <span className="text-right font-medium">{clientLabel ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Starts</span>
                  <span className="text-right font-mono">
                    {startLocal
                      ? format(new Date(startLocal), "EEE, MMM d · HH:mm")
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2 border-t border-border/50 p-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                if (wizardStep === 0) setDialogOpen(false);
                else setWizardStep((s) => s - 1);
              }}
            >
              {wizardStep === 0 ? "Cancel" : "Back"}
            </Button>
            <Button
              className="flex-1 rounded-xl shadow-lg shadow-primary/15"
              disabled={!canContinueWizard()}
              onClick={() => {
                if (wizardStep < 4) {
                  if (!canContinueWizard()) {
                    toast.error("Complete this step first");
                    return;
                  }
                  setWizardStep((s) => s + 1);
                  return;
                }
                void createAppointment();
              }}
            >
              {wizardStep === 4 ? "Create appointment" : "Continue"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
