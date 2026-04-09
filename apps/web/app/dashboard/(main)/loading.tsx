import { StatsSkeleton } from "@/components/shared/data-skeleton";

export default function DashboardMainLoading() {
  return (
    <div className="space-y-6">
      <StatsSkeleton />
      <StatsSkeleton />
    </div>
  );
}
