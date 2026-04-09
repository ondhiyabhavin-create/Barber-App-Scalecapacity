import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type Tone = "default" | "emphasis" | "soft";

export function AppCard({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<typeof Card> & { tone?: Tone }) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-border/60 bg-card/90 shadow-sm transition-all duration-200 hover:shadow-md",
        tone === "emphasis" &&
          "border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-md shadow-primary/10",
        tone === "soft" && "bg-muted/40",
        className
      )}
      {...props}
    />
  );
}
