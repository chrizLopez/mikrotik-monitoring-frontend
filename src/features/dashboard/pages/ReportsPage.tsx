import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ExportButton } from "@/components/ExportButton";
import { LoadingState } from "@/components/LoadingState";
import { RangeSelector } from "@/components/RangeSelector";
import { useComparisons, useIspDistribution, useTopUsers } from "@/features/dashboard/api";
import { formatBytes, formatDisplayName, formatPercentage } from "@/lib/utils";
import { useState } from "react";
import { RangeOption } from "@/types/api";

export function ReportsPage() {
  const [range, setRange] = useState<RangeOption>("cycle");
  const topUsersQuery = useTopUsers(range);
  const distributionQuery = useIspDistribution(range);
  const comparisonsQuery = useComparisons();

  if (topUsersQuery.isLoading || distributionQuery.isLoading || comparisonsQuery.isLoading) {
    return <LoadingState label="Loading reports..." />;
  }

  if (topUsersQuery.isError || distributionQuery.isError || comparisonsQuery.isError || !topUsersQuery.data || !distributionQuery.data || !comparisonsQuery.data) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="mt-2 text-sm text-text-soft">Exports and print-friendly summaries for billing-cycle and selected-range reporting.</p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <div className="flex flex-wrap gap-3">
        <ExportButton range={range} endpoint="/api/dashboard/export/top-users.csv" filename={`top-users-${range}.csv`} label="Export Top Users" />
        <ExportButton range={range} endpoint="/api/dashboard/export/isps.csv" filename={`isps-${range}.csv`} label="Export ISP Totals" />
        <ExportButton range={range} endpoint="/api/dashboard/export/alerts.csv" filename={`alerts-${range}.csv`} label="Export Alerts" />
        <ExportButton range={range} endpoint="/api/dashboard/export/throttling-history.csv" filename={`throttling-${range}.csv`} label="Export Throttling" />
        <a href={`/api/dashboard/print/summary?range=${range}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line/80 bg-surface-soft px-4 py-2 text-sm font-medium text-text transition hover:bg-surface">
          Print Summary
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Top Consumers" description="Selected-range customer consumption.">
          {topUsersQuery.data.items.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUsersQuery.data.items}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" angle={-18} textAnchor="end" height={72} tickFormatter={formatDisplayName} />
                  <YAxis tickFormatter={(value) => formatBytes(Number(value))} />
                  <Tooltip formatter={(value: number) => formatBytes(value)} />
                  <Bar dataKey="usedBytes" fill="#0891b2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="WAN Distribution" description="Traffic share by ISP for the selected range.">
          <div className="space-y-3">
            {distributionQuery.data.items.map((isp) => (
              <div key={isp.id} className="rounded-2xl border border-line/80 bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <Link to={`/isps/${isp.id}`} className="font-medium text-accent">
                    {isp.name}
                  </Link>
                  <span className="text-sm text-text-soft">{formatPercentage(isp.sharePercent ?? 0, 1)}</span>
                </div>
                <p className="mt-1 text-sm text-text-soft">{formatBytes(isp.totalTrafficBytes)}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Historical Comparison" description={`${comparisonsQuery.data.cycleVsPreviousCycle.currentLabel} versus ${comparisonsQuery.data.cycleVsPreviousCycle.previousLabel}.`}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-surface px-4 py-4">
            <p className="text-sm text-text-soft">ISP traffic</p>
            <p className="mt-2 text-2xl font-semibold">{formatBytes(comparisonsQuery.data.cycleVsPreviousCycle.totalIspTraffic.current)}</p>
            <p className="text-sm text-text-soft">Change {formatPercentage(comparisonsQuery.data.cycleVsPreviousCycle.totalIspTraffic.changePercent ?? 0, 1)}</p>
          </div>
          <div className="rounded-2xl bg-surface px-4 py-4">
            <p className="text-sm text-text-soft">User traffic</p>
            <p className="mt-2 text-2xl font-semibold">{formatBytes(comparisonsQuery.data.cycleVsPreviousCycle.totalUserTraffic.current)}</p>
            <p className="text-sm text-text-soft">Change {formatPercentage(comparisonsQuery.data.cycleVsPreviousCycle.totalUserTraffic.changePercent ?? 0, 1)}</p>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
