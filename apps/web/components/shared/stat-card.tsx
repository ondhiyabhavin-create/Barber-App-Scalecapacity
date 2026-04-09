import type { LucideIcon } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppCard } from "@/components/shared/app-card";

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <AppCard>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </AppCard>
  );
}
