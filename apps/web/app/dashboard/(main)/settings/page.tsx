import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Settings
        </p>
        <h1 className="font-heading text-3xl font-semibold">Workspace</h1>
        <p className="text-muted-foreground">
          Billing, Stripe, and plan limits — Phase 2 when you enable real
          payments.
        </p>
      </div>

      <Card className="glass-panel border-border/60 bg-card/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Stripe Connect</CardTitle>
            <CardDescription>
              Deposits, tips, POS, and SaaS subscription billing per plan.
            </CardDescription>
          </div>
          <Badge variant="secondary">Deferred</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Mock checkout is used in the public booking flow. When you are
            ready, add{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              STRIPE_SECRET_KEY
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
            </code>{" "}
            and replace the demo success step with Checkout or Connect.
          </p>
          <Separator />
          <p>
            Webhooks should live in Supabase Edge Functions with signature
            verification and idempotent writes to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              transactions
            </code>
            .
          </p>
        </CardContent>
      </Card>

      <Card className="glass-panel border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Plans</CardTitle>
          <CardDescription>Free · Pro · Studio · Enterprise</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Plan enforcement will run via Edge Functions (booking limits, barber
          seats, marketing gates). Not enforced in this demo build.
        </CardContent>
      </Card>
    </div>
  );
}
