import { getSessionProfile } from "@/lib/auth/profile";
import { CalendarBoard } from "@/components/calendar/calendar-board";

export default async function CalendarPage() {
  const { tenant, profile, effectiveRole } = await getSessionProfile();
  if (!tenant?.id) {
    return null;
  }

  const role = effectiveRole ?? profile?.role;
  const canCreateAppointment = role !== "client";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Calendar
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          <span className="text-gradient">Appointments</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Week view with Supabase Realtime when bookings change.
        </p>
      </div>
      <CalendarBoard
        tenantId={tenant.id}
        canCreateAppointment={canCreateAppointment}
      />
    </div>
  );
}
