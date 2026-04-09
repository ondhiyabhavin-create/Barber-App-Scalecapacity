import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function SettingsTeamPage() {
  const { tenant } = await getSessionProfile();
  if (!tenant?.id) return null;

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, role, name, email, phone, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const rows = users ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">Team & sign-ups</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Accounts linked to your workspace (from Supabase Auth). New visitors register via{" "}
          <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>{" "}
          or{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
          ; the trigger that attaches them to <strong className="text-foreground">{tenant.name}</strong>{" "}
          is your onboarding / invite flow (see seed script for test accounts).
        </p>
      </div>

      <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
        <div className="glass-strong rounded-[15px]">
          <CardHeader>
            <CardTitle className="text-lg">Public registration URLs</CardTitle>
            <CardDescription>Expose these in marketing or QR codes so people can join the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Marketing</Badge>
              <Link
                href="/signup"
                className="rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted/50"
              >
                /signup
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted/50"
              >
                /login
              </Link>
            </div>
            <Separator />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Clients</strong> see a different dashboard (book,
              calendar). <strong className="text-foreground">Staff</strong> and{" "}
              <strong className="text-foreground">owners</strong> are assigned in your database
              (profiles + barbers). This table is a read-only view of who is registered under your
              tenant.
            </p>
          </CardContent>
        </div>
      </Card>

      <Card className="shine-border overflow-hidden rounded-2xl border-0 bg-transparent p-[1px] shadow-none">
        <div className="glass-strong rounded-[15px]">
          <CardHeader>
            <CardTitle className="text-lg">Registered users</CardTitle>
            <CardDescription>
              {rows.length} account{rows.length === 1 ? "" : "s"} in this workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No users yet. Complete onboarding or invite staff to see rows here.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="p-3">Role</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <Badge variant="secondary" className="capitalize">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">{u.name ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">{u.email ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">{u.phone ?? "—"}</td>
                        <td className="p-3 tabular-nums text-muted-foreground">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
