import { Activity, AlertTriangle, GaugeCircle, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { RangeSelector } from "@/components/RangeSelector";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  useAlerts,
  useComparisons,
  useDashboardLive,
  useDashboardSummary,
  useGroupUsage,
  useIspDistribution,
  useTopUsers,
} from "@/features/dashboard/api";
import {
  formatBitsPerSecond,
  formatBytes,
  formatPercentage,
  formatRangeLabel,
  formatTimestamp,
} from "@/lib/utils";
import { ActiveUser, RangeOption, TopUserItem } from "@/types/api";

const ISP_COLORS = ["#0891b2", "#22c55e", "#f97316"];

export function DashboardOverviewPage() {
  const [range, setRange] = useState<RangeOption>("cycle");
  const summaryQuery = useDashboardSummary(range);
  const liveQuery = useDashboardLive();
  const distributionQuery = useIspDistribution(range);
  const topUsersQuery = useTopUsers(range);
  const groupUsageQuery = useGroupUsage(range);
  const alertsQuery = useAlerts(range);
  const comparisonsQuery = useComparisons();

  if (
    summaryQuery.isLoading ||
    liveQuery.isLoading ||
    distributionQuery.isLoading ||
    topUsersQuery.isLoading ||
    alertsQuery.isLoading ||
    comparisonsQuery.isLoading
  ) {
    return <LoadingState label="Loading NOC overview..." />;
  }

  if (
    summaryQuery.isError ||
    liveQuery.isError ||
    distributionQuery.isError ||
    topUsersQuery.isError ||
    alertsQuery.isError ||
    comparisonsQuery.isError ||
    !summaryQuery.data
  ) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  const summary = summaryQuery.data;
  const live = liveQuery.data!;
  const distribution = distributionQuery.data!;
  const alerts = alertsQuery.data!;
  const comparisons = comparisonsQuery.data!.cycleVsPreviousCycle;
  const groupAUsage = groupUsageQuery.data?.items.find((item) => item.group === "GROUP_A")?.totalBytes ?? 0;
  const groupBUsage = groupUsageQuery.data?.items.find((item) => item.group === "GROUP_B")?.totalBytes ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-text-soft">Last poll: {formatTimestamp(summary.lastPollAt)}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">NOC Overview</h1>
          <p className="mt-2 text-sm text-text-soft">
            WAN traffic, quota pressure, alerting, and customer activity from the current monitoring pipeline.
          </p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={`${formatRangeLabel(range)} Usage`}
          value={formatBytes(summary.totals.totalUsageBytes)}
          helper={range === "cycle" ? "Current billing cycle total" : "Directly from range-aware summary"}
          icon={<GaugeCircle className="h-5 w-5" />}
        />
        <StatCard label="Monitored Users" value={summary.totals.totalActiveUsers} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Throttled Users" value={summary.totals.throttledUsers} icon={<Activity className="h-5 w-5" />} />
        <StatCard label="Active Issues" value={alerts.activeIssues} icon={<AlertTriangle className="h-5 w-5" />} helper="Quota or ISP alerts at high severity" />
        <StatCard
          label="Group A Usage"
          value={formatBytes(groupAUsage)}
          icon={<Users className="h-5 w-5" />}
          helper="Home Router, Camaymayan, and Rutor"
        />
        <StatCard
          label="Group B Usage"
          value={formatBytes(groupBUsage)}
          icon={<Users className="h-5 w-5" />}
          helper="Remaining monitored users"
        />
      </div>

      <ChartCard title="Live WAN Traffic" description="Current WAN throughput by interface with recent sparkline samples.">
        <div className="grid gap-4 xl:grid-cols-3">
          {live.isps.map((isp, index) => (
            <div key={isp.id} className="rounded-2xl border border-line/80 bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-soft">{isp.interfaceName}</p>
                  <Link to={`/isps/${isp.id}`} className="mt-1 block text-lg font-semibold text-accent">
                    {isp.name}
                  </Link>
                </div>
                <StatusBadge status={isp.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-soft">RX</p>
                  <p className="font-semibold">{formatBitsPerSecond(isp.currentRxBps)}</p>
                </div>
                <div>
                  <p className="text-text-soft">TX</p>
                  <p className="font-semibold">{formatBitsPerSecond(isp.currentTxBps)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-text-soft">Combined</p>
                  <p className="font-semibold">{formatBitsPerSecond(isp.currentTotalBps ?? 0)}</p>
                </div>
              </div>
              <div className="mt-4 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={isp.trend ?? []}>
                    <Line dataKey="totalBps" type="monotone" stroke={ISP_COLORS[index % ISP_COLORS.length]} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-text-soft">{formatTimestamp(isp.lastUpdatedAt)}</p>
            </div>
          ))}
        </div>
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Top Active Users Right Now" description="Short-window derived download and upload rates from recent queue snapshots.">
          <DataTable<ActiveUser>
            columns={[
              {
                key: "name",
                label: "User",
                render: (user) => (
                  <div>
                    <Link to={`/users/${user.id}`} className="font-medium text-accent">
                      {user.name}
                    </Link>
                    <p className="text-xs text-text-soft">{user.subnet}</p>
                  </div>
                ),
              },
              { key: "group", label: "Group", render: (user) => user.group.replace("_", " ") },
              { key: "down", label: "Download", render: (user) => formatBitsPerSecond(user.downloadBps) },
              { key: "up", label: "Upload", render: (user) => formatBitsPerSecond(user.uploadBps) },
              { key: "combined", label: "Combined", render: (user) => formatBitsPerSecond(user.combinedBps) },
              { key: "state", label: "State", render: (user) => <StatusBadge status={user.state} /> },
            ]}
            rows={live.topActiveUsers}
            getRowKey={(row) => row.id}
            mobileCardRender={(user) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link to={`/users/${user.id}`} className="font-medium text-accent">
                      {user.name}
                    </Link>
                    <p className="text-xs text-text-soft">{user.subnet}</p>
                  </div>
                  <StatusBadge status={user.state} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-soft">Group</p>
                    <p>{user.group.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-text-soft">Combined</p>
                    <p>{formatBitsPerSecond(user.combinedBps)}</p>
                  </div>
                  <div>
                    <p className="text-text-soft">Download</p>
                    <p>{formatBitsPerSecond(user.downloadBps)}</p>
                  </div>
                  <div>
                    <p className="text-text-soft">Upload</p>
                    <p>{formatBitsPerSecond(user.uploadBps)}</p>
                  </div>
                </div>
              </div>
            )}
            emptyState={<EmptyState description="No active user rate data is available yet." />}
          />
        </ChartCard>

        <ChartCard title="Alert Summary" description="Derived quota, health, and unusual-usage insights.">
          <div className="space-y-3">
            {[...alerts.healthAlerts, ...alerts.quotaAlerts, ...alerts.usageAlerts].slice(0, 6).map((alert) => (
              <div key={`${alert.type}-${alert.title}`} className="rounded-2xl border border-line/80 bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{alert.title}</p>
                  <span className="text-xs uppercase tracking-wide text-text-soft">{alert.severity}</span>
                </div>
                <p className="mt-1 text-sm text-text-soft">{alert.subject}</p>
              </div>
            ))}
            {!alerts.healthAlerts.length && !alerts.quotaAlerts.length && !alerts.usageAlerts.length ? <EmptyState description="No active alerts in the selected range." /> : null}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="ISP Load Distribution" description="Traffic share across Old Starlink, New Starlink, and SmartBro.">
          {distribution.items.length ? (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution.items} dataKey="totalTrafficBytes" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                    {distribution.items.map((item, index) => (
                      <Cell key={item.id} fill={ISP_COLORS[index % ISP_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatBytes(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Top Consumers" description="Top usage by selected range.">
          {topUsersQuery.data?.items.length ? (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUsersQuery.data.items.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis type="number" tickFormatter={(value) => formatBytes(Number(value))} />
                  <YAxis type="category" dataKey="name" width={140} />
                  <Tooltip formatter={(value: number) => formatBytes(value)} />
                  <Bar dataKey="usedBytes" fill="#0f766e" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Group A vs Group B Trend" description="Selected-range group share with totals from positive deltas.">
          {groupUsageQuery.data?.items.length ? (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupUsageQuery.data.items}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="group" />
                  <YAxis tickFormatter={(value) => formatBytes(Number(value))} />
                  <Tooltip formatter={(value: number) => formatBytes(value)} />
                  <Bar dataKey="totalBytes" fill="#0891b2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Cycle Comparison" description={`${comparisons.currentLabel} against ${comparisons.previousLabel}.`}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-surface px-4 py-4">
              <p className="text-sm text-text-soft">ISP traffic</p>
              <p className="mt-2 text-xl font-semibold">{formatBytes(comparisons.totalIspTraffic.current)}</p>
              <p className="text-sm text-text-soft">Change: {formatPercentage(comparisons.totalIspTraffic.changePercent ?? 0, 1)}</p>
            </div>
            <div className="rounded-2xl bg-surface px-4 py-4">
              <p className="text-sm text-text-soft">User traffic</p>
              <p className="mt-2 text-xl font-semibold">{formatBytes(comparisons.totalUserTraffic.current)}</p>
              <p className="text-sm text-text-soft">Change: {formatPercentage(comparisons.totalUserTraffic.changePercent ?? 0, 1)}</p>
            </div>
            <div className="md:col-span-2 rounded-2xl bg-surface px-4 py-4">
              <p className="text-sm text-text-soft">Top user movement</p>
              <div className="mt-3 space-y-2">
                {comparisons.topUsers.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                    <span>{item.name}</span>
                    <span className="text-text-soft">
                      {formatBytes(item.currentTotalBytes)} / {formatPercentage(item.changePercent ?? 0, 1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
