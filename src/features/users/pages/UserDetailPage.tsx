import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { QuotaProgressBar } from "@/components/QuotaProgressBar";
import { RangeSelector } from "@/components/RangeSelector";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useQuotaTimeline, useThrottlingHistory, useUsers } from "@/features/users/api";
import {
  formatBitsPerSecond,
  formatBytes,
  formatChartTick,
  formatPercentage,
  formatTimestamp,
} from "@/lib/utils";
import { RangeOption } from "@/types/api";

export function UserDetailPage() {
  const { userId = "" } = useParams();
  const [range, setRange] = useState<RangeOption>("cycle");
  const usersQuery = useUsers();
  const quotaTimelineQuery = useQuotaTimeline(userId, range);
  const throttlingQuery = useThrottlingHistory(userId, range);

  if (usersQuery.isLoading || quotaTimelineQuery.isLoading || throttlingQuery.isLoading) {
    return <LoadingState label="Loading user detail..." />;
  }

  if (usersQuery.isError || quotaTimelineQuery.isError || throttlingQuery.isError || !quotaTimelineQuery.data) {
    return <ErrorState />;
  }

  const user = usersQuery.data?.items.find((item) => item.id === userId);

  if (!user) {
    return <ErrorState title="User not found" description="The selected user was not returned by the API." />;
  }

  const throttle = throttlingQuery.data?.items[0];
  const timeline = quotaTimelineQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-text-soft">{user.subnet}</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-3xl font-semibold">{user.name}</h1>
            <StatusBadge status={user.state} />
          </div>
          <p className="mt-2 text-sm text-text-soft">
            {user.group.replace("_", " ")} | Last updated {formatTimestamp(user.lastUpdatedAt)}
          </p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <section className="panel grid gap-6 p-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div>
            <p className="text-sm text-text-soft">Current max limit</p>
            <p className="mt-1 text-2xl font-semibold">{user.currentMaxLimit}</p>
          </div>
          <QuotaProgressBar value={timeline.summary.usagePercent} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-surface px-4 py-4">
            <dt className="text-sm text-text-soft">Monthly quota</dt>
            <dd className="mt-1 text-xl font-semibold">{formatBytes(timeline.summary.quotaBytes)}</dd>
          </div>
          <div className="rounded-2xl bg-surface px-4 py-4">
            <dt className="text-sm text-text-soft">Used</dt>
            <dd className="mt-1 text-xl font-semibold">{formatBytes(timeline.summary.usedBytes)}</dd>
          </div>
          <div className="rounded-2xl bg-surface px-4 py-4">
            <dt className="text-sm text-text-soft">Remaining</dt>
            <dd className="mt-1 text-xl font-semibold">{formatBytes(timeline.summary.remainingBytes)}</dd>
          </div>
          <div className="rounded-2xl bg-surface px-4 py-4">
            <dt className="text-sm text-text-soft">Usage</dt>
            <dd className="mt-1 text-xl font-semibold">{formatPercentage(timeline.summary.usagePercent, 1)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Download" value={formatBytes(user.downloadBytes)} />
        <StatCard label="Upload" value={formatBytes(user.uploadBytes)} />
        <StatCard label="Current Activity" value={formatBitsPerSecond(user.currentCombinedBps ?? 0)} />
        <StatCard label="Peak Observed" value={formatBitsPerSecond(user.peakCombinedBps ?? 0)} helper={user.peakAt ? formatTimestamp(user.peakAt) : "No peak derived"} />
      </div>

      <ChartCard title="Quota Timeline" description="Cumulative growth within the selected range based on positive counter deltas.">
        {timeline.points.length ? (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline.points}>
                <defs>
                  <linearGradient id="usageGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="timestamp" tickFormatter={formatChartTick} minTickGap={28} />
                <YAxis tickFormatter={(value) => formatBytes(Number(value))} />
                <Tooltip labelFormatter={(value: string) => formatTimestamp(value)} formatter={(value: number) => formatBytes(value)} />
                <Area type="monotone" dataKey="cumulativeBytes" stroke="#0891b2" fillOpacity={1} fill="url(#usageGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState />
        )}
      </ChartCard>

      <ChartCard title="Throttling History" description="Derived from state changes in queue snapshots.">
        {throttle ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-surface px-4 py-4">
              <p className="text-sm text-text-soft">Current state</p>
              <div className="mt-2">
                <StatusBadge status={throttle.currentState} />
              </div>
            </div>
            <div className="rounded-2xl bg-surface px-4 py-4">
              <p className="text-sm text-text-soft">Last state change</p>
              <p className="mt-2 font-semibold">{formatTimestamp(throttle.lastStateChange)}</p>
            </div>
            <div className="rounded-2xl bg-surface px-4 py-4">
              <p className="text-sm text-text-soft">Throttled events</p>
              <p className="mt-2 text-2xl font-semibold">{throttle.throttledEvents}</p>
            </div>
            <div className="md:col-span-3 space-y-3">
              {throttle.transitions.map((transition) => (
                <div key={transition.changedAt} className="rounded-2xl border border-line/80 bg-surface px-4 py-3 text-sm">
                  {transition.fromState} to {transition.toState} at {formatTimestamp(transition.changedAt)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState description="No throttling transitions were derived for the selected range." />
        )}
      </ChartCard>
    </div>
  );
}
