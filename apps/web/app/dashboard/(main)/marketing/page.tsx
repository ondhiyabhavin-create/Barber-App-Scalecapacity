import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/profile";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { BellRing, MessageSquare, Megaphone, Send } from "lucide-react";

export default async function MarketingPage() {
  const { profile } = await getSessionProfile();
  if (profile?.role === "client") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Marketing
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          <span className="text-gradient">Engagement</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          SMS and blast messaging — UI preview. Sending is disabled until the
          integration ships.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
          <div className="glass-strong relative rounded-[15px]">
            <Badge
              variant="secondary"
              className="absolute right-4 top-4 bg-primary/15 text-primary"
            >
              Coming soon
            </Badge>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="size-5 text-primary" />
                SMS reminders
              </CardTitle>
              <CardDescription>
                24h and 2h automated reminders for upcoming appointments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Message template</Label>
                <Textarea
                  rows={4}
                  defaultValue="Hi {name}, reminder: {service} with {barber} at {time}."
                  disabled
                />
              </div>
              <Button className="w-full rounded-xl" disabled>
                <Send className="mr-2 size-4" />
                Enable SMS (Coming soon)
              </Button>
            </CardContent>
          </div>
        </Card>

        <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
          <div className="glass-strong relative rounded-[15px]">
            <Badge
              variant="secondary"
              className="absolute right-4 top-4 bg-primary/15 text-primary"
            >
              Coming soon
            </Badge>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="size-5 text-primary" />
                Blast campaigns
              </CardTitle>
              <CardDescription>
                Reach segments like “hasn&apos;t booked in 30 days”.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Campaign name</Label>
                <Input placeholder="Spring fade promo" disabled />
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Input placeholder="All clients · 420 contacts" disabled />
              </div>
              <Button className="w-full rounded-xl" variant="outline" disabled>
                Send campaign (Coming soon)
              </Button>
            </CardContent>
          </div>
        </Card>
      </div>

      <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
        <div className="glass-strong rounded-[15px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="size-5 text-primary" />
              Receipts & follow-ups
            </CardTitle>
            <CardDescription>
              Post-visit thank you + review request via SMS — Coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Twilio integration will be wired in a future release. You can still
              design copy and segments here without sending real messages.
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
