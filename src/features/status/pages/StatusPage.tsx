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
        <p className="mt-2 text-sm text-text-soft">API connectivity, polling freshness, and the live shared-WAN routing model.</p>
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
          <p className="text-sm text-text-soft">Routing Model</p>
          <p className="mt-3 text-sm text-text-soft">{query.data.networkModel.summary}</p>
        </article>
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">Shared PCC WAN Layout</h2>
        <p className="mt-2 text-sm text-text-soft">
          All monitored users share all WANs through equal PCC. Group A and Group B remain reporting labels only.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {query.data.networkModel.wans.map((wan) => (
            <article key={wan.interfaceName} className="rounded-2xl bg-surface px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-text-soft">{wan.interfaceName}</p>
              <p className="mt-1 font-semibold">{wan.name}</p>
              <p className="mt-2 text-sm text-text-soft">{wan.gateway}</p>
              <p className="mt-1 text-xs text-text-soft">
                {wan.connectionMark} {"->"} {wan.routingMark}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
