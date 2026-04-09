"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const palette = [
  "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
];

function hashCode(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "?";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function SmartAvatar({
  name,
  src,
  emoji,
  className,
  fallbackClassName,
}: {
  name: string;
  src?: string | null;
  emoji?: string | null;
  className?: string;
  fallbackClassName?: string;
}) {
  const swatch = palette[hashCode(name || "user") % palette.length];
  return (
    <Avatar className={cn("size-10 rounded-2xl ring-1 ring-border/60", className)}>
      <AvatarImage src={src ?? undefined} alt={name} />
      <AvatarFallback className={cn("rounded-2xl text-xs font-semibold", swatch, fallbackClassName)}>
        {emoji || initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
