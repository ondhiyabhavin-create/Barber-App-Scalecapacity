"use client";

import { useEffect, useMemo, useState } from "react";
import { endOfDay, format, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { generateSlotsForDay, type WorkingHourRow, type BusyRange } from "@/lib/slots";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MockPaymentSuccess } from "@/components/booking/mock-payment-success";

function normalizeBusyJson(raw: unknown): { start: string; end: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as { start: string; end: string }[];
  if (typeof raw === "object") {
    return Object.values(raw as Record<string, { start: string; end: string }>);
  }
  return [];
}

export type ShopPayload = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    address_line: string | null;
    city: string | null;
  };
  services: {
    id: string;
    name: string;
    duration_min: number;
    price_cents: number;
  }[];
  barbers: {
    barber: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    };
    working_hours: WorkingHourRow[];
  }[];
};

type Props = {
  slug: string;
  initialShop: ShopPayload | null;
};

export function PublicBookingFlow({ slug, initialShop }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [shop] = useState<ShopPayload | null>(initialShop);
  const [serviceId, setServiceId] = useState<string>("");
  const [barberId, setBarberId] = useState<string>("");
  const [day, setDay] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [slot, setSlot] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Date[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"pick" | "pay">("pick");

  useEffect(() => {
    if (!shop?.services?.length) return;
    if (!serviceId) setServiceId(shop.services[0].id);
  }, [shop, serviceId]);

  useEffect(() => {
    if (!shop?.barbers?.length) return;
    if (!barberId) setBarberId(shop.barbers[0].barber.id);
  }, [shop, barberId]);

  const selectedService = shop?.services.find((s) => s.id === serviceId);
  const selectedBarber = shop?.barbers.find((b) => b.barber.id === barberId);

  useEffect(() => {
    void (async () => {
      if (!selectedService || !selectedBarber) return;
      const dayDate = new Date(day + "T12:00:00");
      setLoadingSlots(true);
      setSlot(null);
      const rangeStart = startOfDay(dayDate);
      const rangeEnd = endOfDay(dayDate);

      const { data: busyJson, error: busyErr } = await supabase.rpc(
        "get_public_busy_ranges",
        {
          p_barber_id: selectedBarber.barber.id,
          p_range_start: rangeStart.toISOString(),
          p_range_end: rangeEnd.toISOString(),
        }
      );

      if (busyErr) {
        toast.error(busyErr.message);
        setLoadingSlots(false);
        return;
      }

      const busyArr = normalizeBusyJson(busyJson);
      const busy: BusyRange[] = busyArr.map((b) => ({
        start: new Date(b.start),
        end: new Date(b.end),
      }));

      const generated = generateSlotsForDay(
        dayDate,
        selectedBarber.working_hours,
        selectedService.duration_min,
        busy,
        15
      );
      setSlots(generated);
      setLoadingSlots(false);
    })();
  }, [supabase, selectedService, selectedBarber, day]);

  async function confirmBooking() {
    if (!selectedService || !selectedBarber || !slot) {
      toast.error("Pick a time");
      return;
    }
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }

    const { error } = await supabase.rpc("create_public_booking", {
      p_slug: slug,
      p_barber_id: selectedBarber.barber.id,
      p_service_id: selectedService.id,
      p_start: slot.toISOString(),
      p_client_name: name.trim(),
      p_client_email: email.trim(),
      p_client_phone: phone.trim(),
      p_reference_photo_url: null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setStep("pay");
  }

  if (!shop) {
    return (
      <Card className="glass-panel border-border/60">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-4"
      >
        <div
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-8 backdrop-blur-xl"
          style={{
            backgroundImage: shop.tenant.logo_url
              ? `linear-gradient(120deg, rgba(17,17,17,0.92), rgba(17,17,17,0.55)), url(${shop.tenant.logo_url})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="relative space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Book online</p>
            <h1 className="font-heading text-4xl font-semibold">{shop.tenant.name}</h1>
            <p className="text-sm text-muted-foreground">
              {shop.tenant.address_line ?? ""}
              {shop.tenant.city ? ` · ${shop.tenant.city}` : ""}
            </p>
          </div>
        </div>

        <Card className="glass-panel border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle>Service</CardTitle>
            <CardDescription>Choose a service — duration drives available slots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select
                value={serviceId}
                onValueChange={(v) => v && setServiceId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  {shop.services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {(s.price_cents / 100).toFixed(0)} USD · {s.duration_min}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Barber</Label>
              <Select value={barberId} onValueChange={(v) => v && setBarberId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Barber" />
                </SelectTrigger>
                <SelectContent>
                  {shop.barbers.map((b) => (
                    <SelectItem key={b.barber.id} value={b.barber.id}>
                      {b.barber.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="day">Date</Label>
              <Input id="day" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="glass-panel h-fit border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle>Time</CardTitle>
          <CardDescription>
            {selectedService
              ? `Slots respect ${selectedService.duration_min} minute duration.`
              : "Pick a service"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSlots ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <Button
                  key={s.toISOString()}
                  type="button"
                  variant={slot?.getTime() === s.getTime() ? "default" : "outline"}
                  className="h-10 text-xs"
                  onClick={() => setSlot(s)}
                >
                  {format(s, "HH:mm")}
                </Button>
              ))}
            </div>
          )}

          <Separator />

          {step === "pick" && (
            <>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => void confirmBooking()}>
                Continue to demo payment
              </Button>
            </>
          )}

          {step === "pay" && (
            <MockPaymentSuccess
              onReset={() => {
                setStep("pick");
                setSlot(null);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
