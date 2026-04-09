"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const presets = [15, 30, 45, 60, 75, 90, 120];

type Props = {
  value: number;
  onChange: (minutes: number) => void;
  customMinutes: string;
  onCustomMinutesChange: (value: string) => void;
};

export function DurationPresetPicker({
  value,
  onChange,
  customMinutes,
  onCustomMinutesChange,
}: Props) {
  const isPreset = presets.includes(value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((minutes) => (
          <Button
            key={minutes}
            type="button"
            variant={value === minutes ? "default" : "outline"}
            className={cn("rounded-xl", value === minutes && "shadow-md shadow-primary/20")}
            onClick={() => onChange(minutes)}
          >
            {minutes}m
          </Button>
        ))}
        <Button
          type="button"
          variant={!isPreset ? "default" : "outline"}
          className="rounded-xl"
          onClick={() => onChange(Number(customMinutes || "0") || 5)}
        >
          Custom
        </Button>
      </div>
      {!isPreset ? (
        <input
          type="number"
          min={1}
          step={5}
          value={customMinutes}
          onChange={(e) => {
            onCustomMinutesChange(e.target.value);
            onChange(Math.max(1, Number(e.target.value) || 1));
          }}
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
          placeholder="Custom minutes"
        />
      ) : null}
    </div>
  );
}
