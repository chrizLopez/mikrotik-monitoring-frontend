import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { RangeSelector } from "@/components/RangeSelector";
import { useAlerts } from "@/features/dashboard/api";
import { formatBitsPerSecond, formatLatency, formatPercentage } from "@/lib/utils";
import { useState } from "react";
import { RangeOption } from "@/types/api";

export function AlertsPage() {
  const [range, setRange] = useState<RangeOption>("cycle");
  const query = useAlerts(range);

  if (query.isLoading) {
    return <LoadingState label="Loading alerts..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState />;
  }

  const sections = [
    { title: "Quota Alerts", items: query.data.quotaAlerts },
    { title: "ISP Health Alerts", items: query.data.healthAlerts },
    { title: "Heavy Usage Alerts", items: query.data.usageAlerts },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Alerts</h1>
          <p className="mt-2 text-sm text-text-soft">Derived view-only alerts for quota thresholds, WAN quality, and unusual demand.</p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {sections.map((section) => (
        <ChartCard key={section.title} title={section.title} description={`${section.items.length} items in the selected range.`}>
          {section.items.length ? (
            <div className="space-y-3">
              {section.items.map((alert) => (
                <div key={`${section.title}-${alert.title}`} className="rounded-2xl border border-line/80 bg-surface px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{alert.title}</h3>
                    <span className="text-xs uppercase tracking-wide text-text-soft">{alert.severity}</span>
                  </div>
                  <p className="mt-1 text-sm text-text-soft">{alert.subject}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    {alert.usagePercent != null ? <span>Usage: {formatPercentage(alert.usagePercent, 1)}</span> : null}
                    {alert.latencyMs != null ? <span>Latency: {formatLatency(alert.latencyMs)}</span> : null}
                    {alert.packetLossPercent != null ? <span>Loss: {formatPercentage(alert.packetLossPercent, 1)}</span> : null}
                    {alert.combinedBps != null ? <span>Rate: {formatBitsPerSecond(alert.combinedBps)}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState description={`No ${section.title.toLowerCase()} in the selected range.`} />
          )}
        </ChartCard>
      ))}
    </div>
  );
}
