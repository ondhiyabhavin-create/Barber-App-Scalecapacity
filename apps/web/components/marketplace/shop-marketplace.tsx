"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LocateFixed, MapPin } from "lucide-react";
import { AppCard } from "@/components/shared/app-card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartAvatar } from "@/components/shared/smart-avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";

type ShopItem = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  region: string | null;
  country: string | null;
  logo_url: string | null;
  icon_emoji: string | null;
  latitude: number | null;
  longitude: number | null;
};

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const r = 6371;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return r * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function ShopMarketplace({ shops }: { shops: ShopItem[] }) {
  const [country, setCountry] = useState("all");
  const [region, setRegion] = useState("all");
  const [city, setCity] = useState("all");
  const [radiusKm, setRadiusKm] = useState("0");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const countries = useMemo(() => Array.from(new Set(shops.map((s) => s.country).filter(Boolean))) as string[], [shops]);
  const regions = useMemo(
    () =>
      Array.from(
        new Set(
          shops
            .filter((s) => (country === "all" ? true : s.country === country))
            .map((s) => s.region)
            .filter(Boolean)
        )
      ) as string[],
    [shops, country]
  );
  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          shops
            .filter((s) => (country === "all" ? true : s.country === country))
            .filter((s) => (region === "all" ? true : s.region === region))
            .map((s) => s.city)
            .filter(Boolean)
        )
      ) as string[],
    [shops, country, region]
  );

  const filtered = useMemo(() => {
    const radius = Number(radiusKm || "0");
    return shops
      .filter((s) => (country === "all" ? true : s.country === country))
      .filter((s) => (region === "all" ? true : s.region === region))
      .filter((s) => (city === "all" ? true : s.city === city))
      .map((s) => {
        if (!coords || !s.latitude || !s.longitude) return { ...s, distance: null as number | null };
        return { ...s, distance: distanceKm(coords.lat, coords.lon, s.latitude, s.longitude) };
      })
      .filter((s) => (radius > 0 ? (s.distance ?? Number.POSITIVE_INFINITY) <= radius : true))
      .sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999));
  }, [shops, country, region, city, radiusKm, coords]);

  async function detectLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl border border-border/60 bg-card p-4 md:grid-cols-5">
        <select className="h-10 rounded-xl border border-input bg-background px-3 text-sm" value={country} onChange={(e) => { setCountry(e.target.value); setRegion("all"); setCity("all"); }}>
          <option value="all">All countries</option>
          {countries.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className="h-10 rounded-xl border border-input bg-background px-3 text-sm" value={region} onChange={(e) => { setRegion(e.target.value); setCity("all"); }}>
          <option value="all">All regions</option>
          {regions.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className="h-10 rounded-xl border border-input bg-background px-3 text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="all">All cities</option>
          {cities.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className="h-10 rounded-xl border border-input bg-background px-3 text-sm" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)}>
          <option value="0">Any distance</option>
          <option value="3">Within 3 km</option>
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
          <option value="25">Within 25 km</option>
        </select>
        <button type="button" onClick={detectLocation} className="inline-flex h-10 items-center justify-center rounded-xl border border-border/70 bg-background px-3 text-sm">
          <LocateFixed className="mr-2 size-4" /> Near me
        </button>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((shop) => (
            <AppCard key={shop.id} className="interactive">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <SmartAvatar name={shop.name} src={shop.logo_url} emoji={shop.icon_emoji} />
                  <span>{shop.name}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {shop.city ?? "Unknown city"}, {shop.country ?? "-"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {shop.distance != null ? (
                  <p className="text-xs text-muted-foreground">{shop.distance.toFixed(1)} km away</p>
                ) : null}
                <div className="flex gap-2">
                  <Link href={`/book/${shop.slug}`} className={cn(buttonVariants(), "rounded-xl")}>Book now</Link>
                  <Link href={`/book/${shop.slug}`} className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>View details</Link>
                </div>
              </CardContent>
            </AppCard>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No shops match this filter"
          description="Adjust city/region/country filters or increase near-me radius."
        />
      )}
    </div>
  );
}
