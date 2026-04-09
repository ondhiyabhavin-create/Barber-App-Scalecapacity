"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type EntityOption = { value: string; label: string };

type Props = {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: EntityOption[];
  /** When false, value is cleared so the trigger never shows a raw id */
  ready: boolean;
  placeholder?: string;
  loadingPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
};

/**
 * Select that only commits `value` when `ready` and the id exists in `options`,
 * so the trigger never displays a bare UUID (BarberOS UX rule).
 */
export function EntitySelect({
  value,
  onValueChange,
  options,
  ready,
  placeholder = "Select…",
  loadingPlaceholder = "Loading…",
  disabled,
  className,
  triggerClassName,
  id,
}: Props) {
  const hasMatch = Boolean(value && options.some((o) => o.value === value));
  const resolvedValue = ready && hasMatch ? value : undefined;

  return (
    <Select
      value={resolvedValue}
      onValueChange={(v) => v && onValueChange(v)}
      disabled={disabled || !ready || options.length === 0}
    >
      <SelectTrigger
        id={id}
        className={cn("h-11 w-full min-w-0 rounded-xl border-border/70", triggerClassName)}
      >
        <SelectValue placeholder={ready ? placeholder : loadingPlaceholder} />
      </SelectTrigger>
      <SelectContent className={className}>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
