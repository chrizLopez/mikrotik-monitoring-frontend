import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { useDashboardSummary } from "@/features/dashboard/api";
import { formatTimestamp } from "@/lib/utils";

export function StatusPage() {
  const query = useDashboardSummary("cycle");

  if (query.isLoading) {
    return <LoadingState label="Loading status..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Status</h1>
        <p className="mt-2 text-sm text-text-soft">API connectivity, polling freshness, and billing cycle context.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="panel p-5">
          <p className="text-sm text-text-soft">API Connectivity</p>
          <div className="mt-3">
            <StatusBadge status={query.data.apiStatus} />
          </div>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-text-soft">Last Poll Time</p>
          <p className="mt-3 text-xl font-semibold">{formatTimestamp(query.data.lastPollAt)}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-text-soft">Billing Cycle</p>
          <p className="mt-3 text-xl font-semibold">{query.data.billingCycleLabel}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm text-text-soft">Future Settings</p>
          <p className="mt-3 text-sm text-text-soft">Reserved for polling intervals, alerts, and operational tuning.</p>
        </article>
      </section>
    </div>
  );
}
