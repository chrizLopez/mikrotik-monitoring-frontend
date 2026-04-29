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
import { QuotaProgressBar } from "@/components/QuotaProgressBar";
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
  formatDisplayName,
  formatPercentage,
  formatRangeLabel,
  formatTimestamp,
} from "@/lib/utils";
import { ActiveUser, GroupKey, RangeOption } from "@/types/api";

const ISP_COLORS = ["#0891b2", "#22c55e", "#f97316"];

function getGroupLabel(group: GroupKey) {
  return group === "STARLINK_GROUP" ? "Starlink Group" : "Smart Group";
}

export function DashboardOverviewPage() {
  const [range, setRange] = useState<RangeOption>("cycle");
  const summaryQuery = useDashboardSummary(range);
  const liveQuery = useDashboardLive();
  const distributionQuery = useIspDistribution(range);
  const topUsersQuery = useTopUsers(range);
  const groupUsageQuery = useGroupUsage(range);
  const alertsQuery = useAlerts(range);
  const comparisonsQuery = useComparisons();

  if (summaryQuery.isLoading) {
    return <LoadingState label="Loading NOC overview..." />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  const summary = summaryQuery.data;
  const live = liveQuery.data;
  const distribution = distributionQuery.data;
  const alerts = alertsQuery.data;
  const comparisons = comparisonsQuery.data?.cycleVsPreviousCycle;
  const starlinkGroupUsage = groupUsageQuery.data?.items.find((item) => item.group === "STARLINK_GROUP")?.totalBytes ?? 0;
  const smartGroupUsage = groupUsageQuery.data?.items.find((item) => item.group === "SMART_GROUP")?.totalBytes ?? 0;
  const starlinkUsage = summary.starlinkUsage;
  const smartbroTotal = summary.smartbroTotal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-text-soft">Last poll: {formatTimestamp(summary.lastPollAt)}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">NOC Overview</h1>
          <p className="mt-2 text-sm text-text-soft">
            WAN traffic, Starlink cap pressure, SmartBro distribution, and user activity for the current weighted PCC design.
          </p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Starlink Usage This Month"
          value={formatBytes(starlinkUsage?.usedBytes ?? 0)}
          helper={starlinkUsage ? `${formatPercentage(starlinkUsage.usagePercent, 1)} of ${formatBytes(starlinkUsage.capBytes)} cap` : "Waiting for Starlink usage data"}
          icon={<GaugeCircle className="h-5 w-5" />}
        />
        <StatCard
          label="SmartBro Total This Month"
          value={formatBytes(smartbroTotal?.usedBytes ?? 0)}
          helper={smartbroTotal?.items.map((item) => `${item.label}: ${formatBytes(item.usedBytes)}`).join(" | ") ?? "Combined SmartBro A and SmartBro B"}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label={`${formatRangeLabel(range)} Usage`}
          value={formatBytes(summary.totals.totalUsageBytes)}
          helper={range === "cycle" ? "Current billing cycle total" : "Directly from range-aware summary"}
          icon={<GaugeCircle className="h-5 w-5" />}
        />
        <StatCard label="Monitored Users" value={summary.totals.totalActiveUsers} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Throttled Users" value={summary.totals.throttledUsers} icon={<Activity className="h-5 w-5" />} />
        <StatCard label="Active Issues" value={alerts?.activeIssues ?? "--"} icon={<AlertTriangle className="h-5 w-5" />} helper="Quota or ISP alerts at high severity" />
        <StatCard label="Starlink Group Usage" value={formatBytes(starlinkGroupUsage)} helper="Home Router, VLAN20, VLAN30, and VLAN40" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Smart Group Usage" value={formatBytes(smartGroupUsage)} helper="VLAN50, VLAN60, and VLAN70" icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Starlink 500GB Monitor" description="Cycle-to-date Starlink usage, projection, and daily trend from interface counter deltas.">
          {starlinkUsage ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-surface px-4 py-4">
                  <p className="text-sm text-text-soft">Used</p>
                  <p className="mt-2 text-xl font-semibold">{formatBytes(starlinkUsage.usedBytes)}</p>
                </div>
                <div className="rounded-2xl bg-surface px-4 py-4">
                  <p className="text-sm text-text-soft">Average daily</p>
                  <p className="mt-2 text-xl font-semibold">{formatBytes(starlinkUsage.averageDailyBytes)}</p>
                </div>
                <div className="rounded-2xl bg-surface px-4 py-4">
                  <p className="text-sm text-text-soft">Projected month</p>
                  <p className="mt-2 text-xl font-semibold">{formatBytes(starlinkUsage.projectedMonthlyBytes)}</p>
                </div>
              </div>
              <QuotaProgressBar value={starlinkUsage.usagePercent} />
              <p className="text-sm text-text-soft">
                Thresholds: {starlinkUsage.thresholds.map((threshold) => `${threshold.percent}% ${threshold.reached ? "reached" : "pending"}`).join(" | ")}
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={starlinkUsage.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatBytes(Number(value))} />
                    <Tooltip formatter={(value: number) => formatBytes(value)} />
                    <Line dataKey="totalBytes" type="monotone" stroke="#0891b2" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <EmptyState description="Starlink usage data is not available yet." />
          )}
        </ChartCard>

        <ChartCard title="Group Policy Summary" description="Configured user segmentation for the current routing layout.">
          <div className="space-y-3">
            {summary.groupPolicies.map((group) => (
              <div key={group.key} className="rounded-2xl border border-line/80 bg-surface px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{group.label}</p>
                  <span className="text-xs uppercase tracking-wide text-text-soft">
                    {group.policy.starlink ?? 0}/{group.policy.smart_a ?? 0}/{group.policy.smart_b ?? 0}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-soft">{group.subnets.join(" | ")}</p>
                <p className="mt-2 text-sm text-text-soft">
                  {group.key === "STARLINK_GROUP"
                    ? "Weighted PCC: 70% Starlink, 15% SmartBro A, 15% SmartBro B."
                    : "Weighted PCC: 0% Starlink, 50% SmartBro A, 50% SmartBro B."}
                </p>
              </div>
            ))}
            <div className="rounded-2xl border border-line/80 bg-surface px-4 py-3 text-sm text-text-soft">
              {summary.distributionNote}
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Live WAN Traffic" description="Current WAN throughput by interface with recent sparkline samples.">
        {liveQuery.isError ? <ErrorState title="Live WAN traffic unavailable" description="Current WAN cards failed to load, but the rest of the dashboard is still available." /> : null}
        {live ? (
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
                    <p className="text-text-soft">Download</p>
                    <p className="font-semibold">{formatBitsPerSecond(isp.currentRxBps)}</p>
                  </div>
                  <div>
                    <p className="text-text-soft">Upload</p>
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
        ) : null}
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Top Active Users Right Now" description="Short-window derived download and upload rates from recent queue snapshots.">
          {liveQuery.isError ? <ErrorState title="Active user rates unavailable" description="The live users section timed out or failed." /> : null}
          {live ? (
            <DataTable<ActiveUser>
              columns={[
                {
                  key: "name",
                  label: "User",
                  render: (user) => (
                    <div>
                      <Link to={`/users/${user.id}`} className="font-medium text-accent">
                        {formatDisplayName(user.name)}
                      </Link>
                      <p className="text-xs text-text-soft">{user.subnet}</p>
                    </div>
                  ),
                },
                { key: "group", label: "Group", render: (user) => getGroupLabel(user.group) },
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
                        {formatDisplayName(user.name)}
                      </Link>
                      <p className="text-xs text-text-soft">{user.subnet}</p>
                    </div>
                    <StatusBadge status={user.state} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-text-soft">Group</p>
                      <p>{getGroupLabel(user.group)}</p>
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
          ) : null}
        </ChartCard>

        <ChartCard title="Alert Summary" description="Derived quota, health, and unusual-usage insights.">
          {alertsQuery.isError ? <ErrorState title="Alerts unavailable" description="Alert calculation failed for this refresh." /> : null}
          {alerts ? (
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
          ) : null}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="ISP Load Distribution" description="Traffic share across Starlink, SmartBro A, and SmartBro B.">
          {distributionQuery.isError ? <ErrorState title="Distribution unavailable" description="Traffic distribution failed to load for this range." /> : null}
          {distribution?.items.length ? (
            <div className="space-y-3">
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
              <p className="text-sm text-text-soft">{summary.distributionNote}</p>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Top Consumers" description="Top usage by selected range.">
          {topUsersQuery.isError ? <ErrorState title="Top consumers unavailable" description="Top user aggregation failed for this range." /> : null}
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
        <ChartCard title="Starlink Group vs Smart Group" description="Selected-range group share with totals from positive deltas.">
          {groupUsageQuery.data?.items.length ? (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupUsageQuery.data.items}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="label" />
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

        <ChartCard title="Cycle Comparison" description={comparisons ? `${comparisons.currentLabel} against ${comparisons.previousLabel}.` : "Current cycle against the previous cycle."}>
          {comparisonsQuery.isError || !comparisons ? <ErrorState title="Comparison unavailable" description="Historical comparison could not be loaded." /> : null}
          {comparisons ? (
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
              <div className="rounded-2xl bg-surface px-4 py-4 md:col-span-2">
                <p className="text-sm text-text-soft">Top user movement</p>
                <div className="mt-3 space-y-2">
                  {comparisons.topUsers.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                      <span>{formatDisplayName(item.name)}</span>
                      <span className="text-text-soft">
                        {formatBytes(item.currentTotalBytes)} / {formatPercentage(item.changePercent ?? 0, 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </ChartCard>
      </div>
    </div>
  );
}
