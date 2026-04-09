import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AppCard } from "@/components/shared/app-card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: React.ReactNode;
}) {
  return (
    <AppCard className="px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <Icon className="size-6" />
      </div>
      <h3 className="font-heading text-xl font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {cta ? <div className="mt-6 flex justify-center">{cta}</div> : null}
    </AppCard>
  );
}
