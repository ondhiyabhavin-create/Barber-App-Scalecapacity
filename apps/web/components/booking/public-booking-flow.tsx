"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  endOfDay,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlotStatesForDay, type WorkingHourRow, type BusyRange, type SlotState } from "@/lib/slots";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MockPaymentSuccess } from "@/components/booking/mock-payment-success";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { CountryCodeSelect } from "@/components/shared/country-code-select";

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

const STEP_LABELS = ["Service", "Barber", "Time", "Details", "Payment", "Confirm"];

export function PublicBookingFlow({ slug, initialShop }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [shop, setShop] = useState<ShopPayload | null>(initialShop);
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string>("");
  const [barberId, setBarberId] = useState<string>("");
  const [day, setDay] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [weekAnchor, setWeekAnchor] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [slot, setSlot] = useState<Date | null>(null);
  const [slotStates, setSlotStates] = useState<SlotState[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [prefill, setPrefill] = useState({ name: "", email: "", countryCode: "+1", phoneLocal: "" });
  const [phase, setPhase] = useState<"wizard" | "pay" | "done">("wizard");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");

  useEffect(() => {
    if (!shop?.services?.length) return;
    if (!serviceId) setServiceId(shop.services[0].id);
  }, [shop, serviceId]);

  useEffect(() => {
    if (!shop?.barbers?.length) return;
    if (!barberId) setBarberId(shop.barbers[0].barber.id);
  }, [shop, barberId]);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const fallbackName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
      const fallbackEmail = user.email ?? "";
      const fallbackPhone = typeof user.phone === "string" ? user.phone : "";

      const { data: profile } = await supabase
        .from("users")
        .select("name, email, phone")
        .eq("id", user.id)
        .maybeSingle();

      const rawName = (profile?.name as string | null) ?? fallbackName;
      const rawEmail = (profile?.email as string | null) ?? fallbackEmail;
      const rawPhone = (profile?.phone as string | null) ?? fallbackPhone;
      const normalizedPhone = rawPhone.trim();
      const phoneMatch = normalizedPhone.match(/^(\+\d{1,4})\s*(.*)$/);
      const nextCountryCode = phoneMatch?.[1] ?? "+1";
      const nextPhoneLocal = (phoneMatch?.[2] ?? normalizedPhone).trim();

      setPrefill({
        name: rawName?.trim() ?? "",
        email: rawEmail?.trim() ?? "",
        countryCode: nextCountryCode,
        phoneLocal: nextPhoneLocal,
      });
      setName(rawName?.trim() ?? "");
      setEmail(rawEmail?.trim() ?? "");
      setCountryCode(nextCountryCode);
      setPhoneLocal(nextPhoneLocal);
    })();
  }, [supabase]);

  const selectedService = shop?.services.find((s) => s.id === serviceId);
  const selectedBarber = shop?.barbers.find((b) => b.barber.id === barberId);

  const loadSlots = useCallback(async () => {
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

    const generated = generateSlotStatesForDay(
      dayDate,
      selectedBarber.working_hours,
      selectedService.duration_min,
      busy,
      15
    );
    setSlotStates(generated);
    setLoadingSlots(false);
  }, [supabase, selectedService, selectedBarber, day]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const loadPublicShop = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_public_shop", { p_slug: slug });
    if (error || !data) return;
    setShop(data as ShopPayload);
  }, [supabase, slug]);

  useEffect(() => {
    if (!shop?.tenant?.id) return;
    const tenantId = shop.tenant.id;
    const channel = supabase
      .channel(`public-booking-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => void loadSlots()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => void loadPublicShop()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "barbers",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => void loadPublicShop()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "working_hours",
        },
        () => void loadPublicShop()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, shop?.tenant?.id, loadSlots, loadPublicShop]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i));
  }, [weekAnchor]);

  const morningSlots = useMemo(
    () => slotStates.filter((s) => s.start.getHours() < 12),
    [slotStates]
  );
  const afternoonSlots = useMemo(
    () => slotStates.filter((s) => s.start.getHours() >= 12),
    [slotStates]
  );

  function emailValid(e: string) {
    if (!e.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  function phoneValid(p: string) {
    if (!p.trim()) return true;
    return /^[\d\s+().-]{7,}$/.test(p.trim());
  }

  const phone = phoneLocal.trim() ? `${countryCode} ${phoneLocal.trim()}` : "";
  const detailsValid =
    name.trim().length > 0 && emailValid(email) && phoneValid(phone);

  async function confirmBooking() {
    if (!selectedService || !selectedBarber || !slot) {
      toast.error("Pick a time");
      return;
    }
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    if (!emailValid(email)) {
      toast.error("Enter a valid email or leave it blank");
      return;
    }
    if (!phoneValid(phone)) {
      toast.error("Enter a valid phone or leave it blank");
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

    if (paymentMethod === "online") setPhase("pay");
    else setPhase("done");
  }

  function canContinue(): boolean {
    if (step === 0) return Boolean(serviceId && shop?.services.some((s) => s.id === serviceId));
    if (step === 1) return Boolean(barberId && shop?.barbers.some((b) => b.barber.id === barberId));
    if (step === 2) return slot !== null;
    if (step === 3) return detailsValid;
    if (step === 4) return paymentMethod === "cash" || paymentMethod === "online";
    if (step === 5)
      return Boolean(
        selectedService &&
          selectedBarber &&
          slot &&
          detailsValid
      );
    return false;
  }

  function goNext() {
    if (!canContinue()) {
      if (step === 3) toast.error("Check your details");
      return;
    }
    if (step < 5) setStep((s) => s + 1);
    else void confirmBooking();
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
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
  if (!shop.services?.length) {
    return (
      <EmptyState
        icon={ChevronRight}
        title="Booking unavailable"
        description="This shop has no services configured yet. Ask the shop owner to create the first service."
        cta={
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to homepage
          </Link>
        }
      />
    );
  }

  const tz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "local time";

  return (
    <div className="flex min-h-[min(100dvh,900px)] flex-col pb-28 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-start">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl px-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ChevronLeft className="mr-1 size-4" />
            Back
          </Button>
        </div>
        <div
          className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card/50 to-accent/5 p-6 backdrop-blur-xl sm:p-8 md:p-8"
          style={{
            backgroundImage: shop.tenant.logo_url
              ? `linear-gradient(120deg, color-mix(in srgb, var(--foreground) 82%, transparent), color-mix(in srgb, var(--primary) 28%, transparent)), url(${shop.tenant.logo_url})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="relative space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Book online</p>
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{shop.tenant.name}</h1>
            <p className="text-sm text-muted-foreground">
              {shop.tenant.address_line ?? ""}
              {shop.tenant.city ? ` · ${shop.tenant.city}` : ""}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="rounded-2xl border border-border/50 bg-card/40 px-3 py-4 shadow-sm backdrop-blur-md sm:px-4">
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Step {step + 1} of {STEP_LABELS.length}
          </p>
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 sm:justify-center sm:gap-2">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:flex-initial sm:min-w-[4.5rem]">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary/20 text-primary ring-2 ring-primary/40"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className={cn(
                    "hidden text-[10px] font-medium sm:block",
                    i === step ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {phase === "wizard" && (
          <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
            <div className="glass-strong rounded-[15px]">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg">
                  {step === 0 && "Choose a service"}
                  {step === 1 && "Choose your barber"}
                  {step === 2 && "Pick a time"}
                  {step === 3 && "Your details"}
                  {step === 4 && "Payment method"}
                  {step === 5 && "Review & confirm"}
                </CardTitle>
                <CardDescription>
                  {step === 2 && selectedService
                    ? `${format(new Date(day + "T12:00:00"), "EEE, MMM d")} · ${selectedService.duration_min} min · Times in ${tz}`
                    : step === 5
                      ? "Confirm your appointment before demo payment."
                      : " "}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                {step === 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shop.services.map((s) => {
                      const active = s.id === serviceId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setServiceId(s.id)}
                          className={cn(
                            "rounded-xl border p-4 text-left transition-all duration-200 ease-out",
                            active
                              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                              : "border-border/70 bg-card/50 hover:border-border hover:bg-muted/50"
                          )}
                        >
                          <p className="font-medium">{s.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {(s.price_cents / 100).toFixed(0)} USD · {s.duration_min} min
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shop.barbers.map((b) => {
                      const active = b.barber.id === barberId;
                      const initial = b.barber.display_name
                        .split(/\s+/)
                        .map((x) => x[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <button
                          key={b.barber.id}
                          type="button"
                          onClick={() => setBarberId(b.barber.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ease-out",
                            active
                              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                              : "border-border/70 bg-card/50 hover:border-border hover:bg-muted/50"
                          )}
                        >
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                            {b.barber.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={b.barber.avatar_url}
                                alt=""
                                className="size-12 rounded-full object-cover"
                              />
                            ) : (
                              initial
                            )}
                          </span>
                          <div>
                            <p className="font-medium">{b.barber.display_name}</p>
                            <p className="text-xs text-muted-foreground">Available for booking</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 rounded-xl"
                        onClick={() => setWeekAnchor((w) => addDays(w, -7))}
                        aria-label="Previous week"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <p className="text-center text-sm font-medium text-muted-foreground">
                        {format(weekDays[0], "MMM d")} – {format(weekDays[6], "MMM d")}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 rounded-xl"
                        onClick={() => setWeekAnchor((w) => addDays(w, 7))}
                        aria-label="Next week"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                    <div className="-mx-1 flex gap-2 overflow-x-auto pb-2">
                      {weekDays.map((d) => {
                        const key = format(d, "yyyy-MM-dd");
                        const selected = day === key;
                        const past = isBefore(startOfDay(d), startOfDay(new Date()));
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={past}
                            onClick={() => setDay(key)}
                            className={cn(
                              "flex min-w-[3.25rem] flex-col items-center rounded-xl border px-2 py-2 text-xs transition-colors",
                              selected
                                ? "border-primary bg-primary/15 text-primary"
                                : past
                                  ? "cursor-not-allowed opacity-40"
                                  : "border-border/60 bg-card/50 hover:border-border"
                            )}
                          >
                            <span className="text-[10px] uppercase text-muted-foreground">
                              {format(d, "EEE")}
                            </span>
                            <span className="font-semibold tabular-nums">{format(d, "d")}</span>
                          </button>
                        );
                      })}
                    </div>

                    {loadingSlots ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-[4.5rem] rounded-lg" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {morningSlots.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Morning
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {morningSlots.map((s) => (
                                <Button
                                  key={s.start.toISOString()}
                                  type="button"
                                  variant={slot && isSameDay(slot, s.start) && slot.getTime() === s.start.getTime() ? "default" : "outline"}
                                  size="sm"
                                  disabled={!s.available}
                                  className={cn(
                                    "h-10 min-w-[4.5rem] rounded-lg font-mono text-xs",
                                    !s.available && "border-destructive/50 text-destructive line-through opacity-70"
                                  )}
                                  onClick={() => setSlot(s.start)}
                                >
                                  {format(s.start, "HH:mm")}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {afternoonSlots.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Afternoon
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {afternoonSlots.map((s) => (
                                <Button
                                  key={s.start.toISOString()}
                                  type="button"
                                  variant={slot && isSameDay(slot, s.start) && slot.getTime() === s.start.getTime() ? "default" : "outline"}
                                  size="sm"
                                  disabled={!s.available}
                                  className={cn(
                                    "h-10 min-w-[4.5rem] rounded-lg font-mono text-xs",
                                    !s.available && "border-destructive/50 text-destructive line-through opacity-70"
                                  )}
                                  onClick={() => setSlot(s.start)}
                                >
                                  {format(s.start, "HH:mm")}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {!morningSlots.length && !afternoonSlots.length ? (
                          <p className="text-sm text-muted-foreground">No slots this day — try another date.</p>
                        ) : null}
                      </>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pb-name">Name</Label>
                      <Input
                        id="pb-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 rounded-xl"
                        autoComplete="name"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pb-email">Email</Label>
                      <Input
                        id="pb-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl"
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                      {email && !emailValid(email) ? (
                        <p className="text-xs text-destructive">Enter a valid email</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pb-phone">Phone</Label>
                      <div className="flex gap-2">
                        <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                        <Input
                          id="pb-phone"
                          type="tel"
                          value={phoneLocal}
                          onChange={(e) => setPhoneLocal(e.target.value)}
                          className="h-11 rounded-xl"
                          autoComplete="tel-national"
                          placeholder="98765 43210"
                        />
                      </div>
                      {phone && !phoneValid(phone) ? (
                        <p className="text-xs text-destructive">Enter a valid phone number</p>
                      ) : null}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={cn(
                        "rounded-xl border p-4 text-left transition",
                        paymentMethod === "cash"
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border/70 hover:bg-muted/40"
                      )}
                    >
                      <p className="font-medium">Pay at shop</p>
                      <p className="text-xs text-muted-foreground">Reserve now, pay cash/card in person.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={cn(
                        "rounded-xl border p-4 text-left transition",
                        paymentMethod === "online"
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border/70 hover:bg-muted/40"
                      )}
                    >
                      <p className="font-medium">Pay online</p>
                      <p className="text-xs text-muted-foreground">Mock checkout for this build.</p>
                    </button>
                  </div>
                )}

                {step === 5 && selectedService && selectedBarber && slot && (
                  <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Service</span>
                      <span className="text-right font-medium">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Barber</span>
                      <span className="text-right font-medium">{selectedBarber.barber.display_name}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">When</span>
                      <span className="text-right font-mono text-sm">
                        {format(slot, "EEE, MMM d · HH:mm")}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Guest</span>
                      <span className="text-right font-medium">{name.trim()}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-right font-semibold">
                        ${(selectedService.price_cents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Payment</span>
                      <span className="text-right font-medium">{paymentMethod === "cash" ? "Pay at shop" : "Pay online"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        )}

        {phase === "pay" && (
          <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
            <div className="glass-strong rounded-[15px]">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Demo payment</CardTitle>
                <CardDescription>Your booking is saved — this is a mock checkout.</CardDescription>
              </CardHeader>
              <CardContent>
                <MockPaymentSuccess
                  onReset={() => {
                    setPhase("wizard");
                    setStep(0);
                    setSlot(null);
                    setName(prefill.name);
                    setEmail(prefill.email);
                    setCountryCode(prefill.countryCode);
                    setPhoneLocal(prefill.phoneLocal);
                  }}
                />
              </CardContent>
            </div>
          </Card>
        )}
        {phase === "done" && (
          <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
            <div className="glass-strong rounded-[15px]">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Booking confirmed</CardTitle>
                <CardDescription>Your appointment is reserved. Payment due at shop.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  onClick={() => {
                    setPhase("wizard");
                    setStep(0);
                    setSlot(null);
                    setName(prefill.name);
                    setEmail(prefill.email);
                    setCountryCode(prefill.countryCode);
                    setPhoneLocal(prefill.phoneLocal);
                  }}
                >
                  Book another
                </Button>
              </CardContent>
            </div>
          </Card>
        )}
      </motion.div>

      {phase === "wizard" && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-md backdrop-blur-md md:static md:z-auto md:mt-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
          <div className="app-content-max flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="min-w-[5rem] flex-1 rounded-xl sm:flex-none"
              onClick={goBack}
              disabled={step === 0}
            >
              Back
            </Button>
            <Button
              type="button"
              className="min-w-0 flex-[2] rounded-xl shadow-md shadow-primary/15 sm:flex-1"
              onClick={() => void goNext()}
              disabled={!canContinue()}
            >
              {step === 5 ? "Confirm booking" : "Next"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
