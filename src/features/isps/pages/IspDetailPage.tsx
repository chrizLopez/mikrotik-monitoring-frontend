import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { RangeSelector } from "@/components/RangeSelector";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useDashboardIsps } from "@/features/dashboard/api";
import { useIspHealthHistory, useIspHistory } from "@/features/isps/api";
import {
  formatBitsPerSecond,
  formatBytes,
  formatChartTick,
  formatDurationMinutes,
  formatLatency,
  formatPercentage,
  formatTimestamp,
} from "@/lib/utils";
import { RangeOption } from "@/types/api";

export function IspDetailPage() {
  const { ispId = "" } = useParams();
  const [range, setRange] = useState<RangeOption>("24h");
  const query = useIspHistory(ispId, range);
  const healthQuery = useIspHealthHistory(ispId, range);
  const ispsQuery = useDashboardIsps();

  if (query.isLoading || healthQuery.isLoading || ispsQuery.isLoading) {
    return <LoadingState label="Loading ISP detail..." />;
  }

  if (query.isError || healthQuery.isError || ispsQuery.isError || !query.data || !healthQuery.data) {
    return <ErrorState />;
  }

  const { totals, points } = query.data;
  const health = healthQuery.data;
  const isp = ispsQuery.data?.items.find((item) => item.id === ispId || item.interfaceName === ispId);

  if (!isp) {
    return <ErrorState title="ISP not found" description="The selected ISP was not returned by the API." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-text-soft">{isp.interfaceName}</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold sm:text-3xl">{isp.name}</h1>
            <StatusBadge status={health.latest.status ?? isp.status} />
          </div>
          <p className="mt-2 text-sm text-text-soft">Last updated: {formatTimestamp(isp.lastUpdatedAt)}</p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(ispsQuery.data?.items ?? []).map((item) => (
          <Link
            key={item.id}
            to={`/isps/${item.id}`}
            className={`rounded-xl px-3 py-2 text-sm ${item.id === isp.id ? "bg-accent text-white" : "bg-surface text-text-soft"}`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current Download" value={formatBitsPerSecond(isp.currentRxBps)} />
        <StatCard label="Current Upload" value={formatBitsPerSecond(isp.currentTxBps)} />
        <StatCard label="Range Traffic" value={formatBytes(totals.combinedBytes)} />
        <StatCard label="Peak Snapshot" value={formatBitsPerSecond(Math.max(...points.map((point) => point.rxBps + point.txBps), 0))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Latest Latency" value={formatLatency(health.latest.latencyMs)} />
        <StatCard label="Packet Loss" value={formatPercentage(health.latest.packetLossPercent ?? 0, 1)} />
        <StatCard label="Downtime" value={formatDurationMinutes(health.outages.totalDowntimeMinutes)} helper={`${health.outages.count} outages`} />
      </div>

      <ChartCard title="Throughput History" description="RX/TX history for the selected range.">
        {points.length ? (
          <div className="h-[300px] sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="timestamp" tickFormatter={formatChartTick} minTickGap={28} />
                <YAxis tickFormatter={(value) => formatBitsPerSecond(Number(value))} />
                <Tooltip labelFormatter={(value: string) => formatTimestamp(value)} formatter={(value: number) => formatBitsPerSecond(value)} />
                <Legend />
                <Line type="monotone" dataKey="rxBps" stroke="#0891b2" strokeWidth={3} dot={false} name="Download" />
                <Line type="monotone" dataKey="txBps" stroke="#22c55e" strokeWidth={3} dot={false} name="Upload" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState />
        )}
      </ChartCard>

      <ChartCard title="Latency and Loss" description="Read-only ISP quality history from health snapshots.">
        {health.points.length ? (
          <div className="h-[300px] sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={health.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="timestamp" tickFormatter={formatChartTick} minTickGap={28} />
                <YAxis yAxisId="left" tickFormatter={(value) => formatLatency(Number(value))} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${Number(value)}%`} />
                <Tooltip
                  labelFormatter={(value: string) => formatTimestamp(value)}
                  formatter={(value: number, name: string) =>
                    name === "Packet Loss" ? formatPercentage(value, 1) : formatLatency(value)
                  }
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="latencyMs" stroke="#f97316" strokeWidth={3} dot={false} name="Latency" />
                <Line yAxisId="right" type="monotone" dataKey="packetLossPercent" stroke="#ef4444" strokeWidth={3} dot={false} name="Packet Loss" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState description="No ISP health history has been recorded yet." />
        )}
      </ChartCard>
    </div>
  );
}
