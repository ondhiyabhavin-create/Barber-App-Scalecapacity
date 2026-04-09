import { getSessionProfile } from "@/lib/auth/profile";
import { CalendarBoard } from "@/components/calendar/calendar-board";

export default async function CalendarPage() {
  const { tenant } = await getSessionProfile();
  if (!tenant?.id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Calendar
        </p>
        <h1 className="font-heading text-3xl font-semibold">Appointments</h1>
        <p className="text-muted-foreground">
          Week view with Supabase Realtime updates when bookings change.
        </p>
      </div>
      <CalendarBoard tenantId={tenant.id} />
    </div>
  );
}
